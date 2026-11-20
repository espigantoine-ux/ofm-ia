import { getAnthropicClient } from "@/lib/anthropic";
import type { Creator, Message, CreatorStatus } from "@/lib/types/database";

export interface DraftResult {
  draft: string;
  intent: "interesse" | "question" | "refus" | "demande_rdv" | "neutre";
  isRefusal: boolean;
  suggestedStatus: CreatorStatus | null;
  teamNote: string;
}

const DRAFT_TOOL = {
  name: "analyze_and_draft",
  description: "Analyse le dernier message du créateur et prépare une proposition de réponse.",
  input_schema: {
    type: "object" as const,
    properties: {
      draft: {
        type: "string",
        description: "Le message proposé, 3 lignes maximum, ton humain et naturel, une seule question à la fois.",
      },
      intent: {
        type: "string",
        enum: ["interesse", "question", "refus", "demande_rdv", "neutre"],
      },
      is_refusal: { type: "boolean", description: "true si le créateur refuse ou se désiste clairement." },
      suggested_status: {
        type: ["string", "null"],
        enum: ["nouveau", "en_attente", "contacte", "interesse", "refuse", "signe", null],
        description: "Statut CRM suggéré au vu de cet échange, ou null si rien ne doit changer.",
      },
      team_note: {
        type: "string",
        description: "Note interne brève pour l'équipe (jamais envoyée au créateur) — ce qu'il faut savoir en un coup d'œil.",
      },
    },
    required: ["draft", "intent", "is_refusal", "team_note"],
  },
};

// Contrainte produit non négociable : cet outil ne rédige QUE dans le cadre
// d'une conversation déjà engagée (candidature entrante ou prospect déjà
// contacté manuellement par un humain) — jamais un premier message à froid.
// Il ne doit jamais inventer de tarif, de commission, de clause de contrat
// ou toute autre information commerciale qui ne figure pas explicitement
// dans le contexte fourni ci-dessous.
function buildSystemPrompt(creator: Creator): string {
  return `Tu rédiges, pour le compte d'une agence qui gère des créateurs de contenu (non-adulte), une PROPOSITION de réponse à un message déjà reçu dans une conversation déjà engagée. Tu ne décides jamais d'envoyer quoi que ce soit toi-même — un humain valide, modifie ou refuse chaque proposition avant tout envoi réel.

Contexte du créateur :
- Plateforme : ${creator.platform}
- Origine : ${creator.source === "inbound" ? "a postulé via le formulaire de candidature" : "repéré manuellement par l'équipe"}
- Statut actuel : ${creator.status}
- Notes internes de l'équipe : ${creator.notes || "aucune"}
${creator.application_answers ? `- Réponses de candidature : ${JSON.stringify(creator.application_answers)}` : ""}

Règles strictes :
- Jamais plus de 3 lignes. Langage naturel, phrases simples, ton humain — jamais de vocabulaire corporate ou compliqué.
- Une seule question à la fois.
- N'invente JAMAIS une information commerciale (tarif, pourcentage de commission, clause de contrat, délai de paiement...) qui n'est pas explicitement dans le contexte ci-dessus ou dans l'historique de conversation. Si cette information manque pour répondre complètement, pose une question ou indique que l'équipe reviendra avec le détail — ne comble jamais le vide en inventant un chiffre.
- Détecte explicitement un refus ou un désistement (is_refusal) plutôt que de l'ignorer.
- La note d'équipe (team_note) est interne, jamais envoyée au créateur — sois direct et bref.`;
}

export async function generateDraft(creator: Creator, history: Message[]): Promise<DraftResult> {
  const anthropic = getAnthropicClient();

  const conversationText = history
    .filter((m) => m.status !== "rejected")
    .map((m) => `[${m.sender === "creator" ? "Créateur" : m.sender === "agent" ? "Équipe" : "Brouillon IA précédent"}] ${m.content}`)
    .join("\n");

  const message = await anthropic.messages.create({
    model: "claude-opus-5",
    max_tokens: 1024,
    thinking: { type: "adaptive" },
    system: buildSystemPrompt(creator),
    tools: [DRAFT_TOOL],
    tool_choice: { type: "tool", name: "analyze_and_draft" },
    messages: [
      {
        role: "user",
        content: `Historique de la conversation :\n${conversationText || "(aucun message encore)"}\n\nPrépare la proposition de réponse au dernier message du créateur.`,
      },
    ],
  });

  const toolUse = message.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("L'IA n'a pas renvoyé de proposition structurée.");
  }
  const input = toolUse.input as {
    draft: string;
    intent: DraftResult["intent"];
    is_refusal: boolean;
    suggested_status: CreatorStatus | null;
    team_note: string;
  };

  return {
    draft: input.draft,
    intent: input.intent,
    isRefusal: input.is_refusal,
    suggestedStatus: input.suggested_status ?? null,
    teamNote: input.team_note,
  };
}
