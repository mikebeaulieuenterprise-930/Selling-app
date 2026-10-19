// Les consignes données à l'IA, dans la langue de l'utilisateur.

import type { Locale } from "@/lib/i18n/config";
import { getDict } from "@/lib/i18n/dictionaries";
import type { Lead, Offer } from "@/lib/supabase/types";
import type { OfferAi } from "./schemas";

export type OfferInput = Pick<
  Offer,
  | "product_name"
  | "product_description"
  | "price_hint"
  | "customer_types"
  | "customer_detail"
  | "channels"
  | "problems"
  | "problem_detail"
>;

export function systemPrompt(locale: Locale): string {
  if (locale === "en") {
    return [
      "You are Closer, a pragmatic sales coach for founders, freelancers and product builders who know how to build but freeze when they have to sell.",
      "You speak to the user as a peer: simple, direct, warm, no marketing jargon, no hype.",
      "Your advice is concrete, short, and doable in under 15 minutes.",
      "You never promise something the product does not do: you rely only on the information provided and you never invent numbers, customers or results.",
      "When you write a message for a prospect, it must sound human, respectful, with zero pressure, and end with one clear next step (a question or a 15-minute call).",
      "Answer only in the requested JSON format.",
    ].join(" ");
  }
  return [
    "Tu es Closer, un coach de vente pragmatique pour des fondateurs, freelances et créateurs de produits qui savent construire mais bloquent quand il faut vendre.",
    "Tu parles à l'utilisateur au « tu », en français simple et direct (registre professionnel du Québec, pas de jargon marketing, pas d'anglicismes inutiles, pas de superlatifs).",
    "Tes conseils sont concrets, courts, applicables en moins de 15 minutes.",
    "Tu ne promets jamais ce que le produit ne fait pas : tu t'appuies uniquement sur les informations fournies et tu n'inventes ni chiffres, ni clients, ni résultats.",
    "Quand tu rédiges un message pour un prospect, il doit sonner humain, respectueux, sans pression, et finir par une seule prochaine étape claire (une question ou un appel de 15 minutes).",
    "Réponds uniquement dans le format JSON demandé.",
  ].join(" ");
}

/** Décrit l'offre en texte lisible, libellés dans la langue de l'utilisateur. */
export function offerBlock(offer: OfferInput, locale: Locale, ai?: OfferAi | null): string {
  const t = getDict(locale);
  const label = (map: Record<string, string>, key: string) => map[key] ?? key;
  const list = (items: string[], map: Record<string, string>) =>
    items.length ? items.map((k) => label(map, k)).join(", ") : "—";

  const lines = [
    `${locale === "en" ? "Product" : "Produit"} : ${offer.product_name}`,
    `${locale === "en" ? "What it does" : "Ce que ça fait"} : ${offer.product_description}`,
    `${locale === "en" ? "Price range" : "Ordre de prix"} : ${offer.price_hint ? label(t.onboarding.step1.prices, offer.price_hint) : "—"}`,
    `${locale === "en" ? "Customer types" : "Types de clients"} : ${list(offer.customer_types, t.onboarding.step2.types)}`,
  ];
  if (offer.customer_detail) lines.push(`${locale === "en" ? "Customer detail" : "Précision client"} : ${offer.customer_detail}`);
  lines.push(`${locale === "en" ? "Problems solved" : "Problèmes réglés"} : ${list(offer.problems, t.onboarding.step3.problems)}`);
  if (offer.problem_detail) lines.push(`${locale === "en" ? "Problem detail" : "Précision problème"} : ${offer.problem_detail}`);
  lines.push(`${locale === "en" ? "Outreach channels" : "Canaux de prospection"} : ${list(offer.channels, t.enums.channel)}`);

  if (ai) {
    lines.push(`${locale === "en" ? "Positioning" : "Positionnement"} : ${ai.positioning}`);
    lines.push(`Pitch : ${ai.pitch}`);
    lines.push(`${locale === "en" ? "Arguments" : "Arguments"} : ${ai.value_props.join(" | ")}`);
  }
  return lines.join("\n");
}

export function offerPrompt(input: OfferInput, locale: Locale): string {
  const block = offerBlock(input, locale);
  if (locale === "en") {
    return `Here is the user's offer:\n\n${block}\n\nProduce their sales positioning. Rules: icp_summary in one precise sentence; positioning in two sentences (for whom, which problem, what is different); pitch as one spoken sentence of 25 words max; call_opener as two natural sentences ending with an open question; exactly 3 value_props, one sentence each, concrete, no invented numbers; exactly 3 likely_objections with a calm 1-2 sentence answer that ends with a question. Write everything in English.`;
  }
  return `Voici l'offre de l'utilisateur :\n\n${block}\n\nProduis son positionnement de vente. Règles : icp_summary en une phrase précise ; positioning en deux phrases (pour qui, quel problème, quelle différence) ; pitch en une phrase parlée de 25 mots max ; call_opener en deux phrases naturelles qui finissent par une question ouverte ; exactement 3 value_props, une phrase chacun, concrets, sans chiffres inventés ; exactement 3 likely_objections avec une réponse calme de 1 à 2 phrases qui finit par une question. Écris tout en français.`;
}

export function segmentsPrompt(offer: Offer, ai: OfferAi | null, locale: Locale): string {
  const block = offerBlock(offer, locale, ai);
  if (locale === "en") {
    return `Here is the user's offer:\n\n${block}\n\nPropose 3 to 5 customer segments to target, ordered from most to least promising. For each: a short name; who they are in one sentence; need_score (0-100: how frequent and painful the problem is for them); budget_score (0-100: can they pay this price without a heavy buying process); reach_score (0-100: how easy they are to find and reach with the user's channels); a concrete reason; 3-5 precise places to find them (Google Maps categories, directories, associations, Facebook groups, LinkedIn searches, trade shows, public registries such as the Quebec RBQ or REQ when relevant); 3-5 observable buying signals (hiring, new reviews, growth, a recent complaint, a season); the angle of the first message in one sentence. Prefer segments the user can realistically reach this week. Write everything in English.`;
  }
  return `Voici l'offre de l'utilisateur :\n\n${block}\n\nPropose 3 à 5 segments de clients à viser, du plus prometteur au moins prometteur. Pour chacun : un nom court ; qui ils sont en une phrase ; need_score (0-100 : le problème est-il fréquent et douloureux pour eux) ; budget_score (0-100 : peuvent-ils payer ce prix sans processus d'achat lourd) ; reach_score (0-100 : sont-ils faciles à trouver et à joindre avec les canaux de l'utilisateur) ; une raison concrète ; 3 à 5 endroits précis où les trouver (catégories Google Maps, annuaires, associations, groupes Facebook, recherches LinkedIn, salons, registres publics comme la RBQ ou le REQ au Québec si pertinent) ; 3 à 5 signaux d'achat observables (embauche, nouveaux avis, croissance, plainte récente, saison) ; l'angle du premier message en une phrase. Privilégie les segments que l'utilisateur peut vraiment joindre cette semaine. Écris tout en français.`;
}

export type LeadContext = Pick<Lead, "name" | "company" | "role" | "status" | "notes"> & {
  segment_name: string | null;
};

const CHANNEL_RULES: Record<Locale, Record<string, string>> = {
  fr: {
    sms: "Canal SMS : 2 à 3 phrases max, ton naturel, pas de formule lourde, même niveau de tutoiement/vouvoiement que le lead.",
    email: "Canal courriel : 4 à 8 lignes, salutation courte, pas d'objet, une seule demande à la fin.",
    call: "Canal appel : écris ce que dire à l'oral, en 3 à 5 phrases courtes, pas un script à lire mot à mot.",
    linkedin: "Canal LinkedIn : 3 à 4 phrases, ton personnel, pas de pitch commercial frontal.",
    in_person: "En personne : 2 à 4 phrases à dire de vive voix, simples et directes.",
    other: "Canal non précisé : 3 à 5 phrases, ton naturel.",
  },
  en: {
    sms: "SMS channel: 2-3 sentences max, natural tone, no heavy formalities, mirror the lead's tone.",
    email: "Email channel: 4-8 lines, short greeting, no subject line, a single ask at the end.",
    call: "Call channel: write what to say out loud in 3-5 short sentences, not a word-for-word script.",
    linkedin: "LinkedIn channel: 3-4 sentences, personal tone, no frontal sales pitch.",
    in_person: "In person: 2-4 sentences to say out loud, simple and direct.",
    other: "Unspecified channel: 3-5 sentences, natural tone.",
  },
};

export function replyPrompt(
  args: { offer: Offer; offerAi: OfferAi | null; lead: LeadContext | null; channel: string; message: string },
  locale: Locale,
): string {
  const t = getDict(locale);
  const block = offerBlock(args.offer, locale, args.offerAi);
  const channelRule = CHANNEL_RULES[locale][args.channel] ?? CHANNEL_RULES[locale].other;

  const leadLines: string[] = [];
  if (args.lead) {
    leadLines.push(`${locale === "en" ? "Name" : "Nom"} : ${args.lead.name}`);
    if (args.lead.company) leadLines.push(`${locale === "en" ? "Company" : "Entreprise"} : ${args.lead.company}`);
    if (args.lead.role) leadLines.push(`${locale === "en" ? "Role" : "Rôle"} : ${args.lead.role}`);
    if (args.lead.segment_name) leadLines.push(`Segment : ${args.lead.segment_name}`);
    leadLines.push(`${locale === "en" ? "Status" : "Statut"} : ${t.enums.status[args.lead.status as keyof typeof t.enums.status] ?? args.lead.status}`);
    if (args.lead.notes) leadLines.push(`Notes : ${args.lead.notes}`);
  }
  const leadBlock = leadLines.length
    ? leadLines.join("\n")
    : locale === "en"
      ? "(no lead details)"
      : "(aucun détail sur le lead)";

  if (locale === "en") {
    return `The user's offer:\n\n${block}\n\nThe lead:\n${leadBlock}\n\nThe lead's latest message (channel: ${args.channel}):\n"""\n${args.message}\n"""\n\nTasks: identify the real objection behind the words and the lead's temperature; explain in 1-2 sentences what they really mean; name the one next step to aim for (usually a 15-minute call or a clarifying question); write the reply to send. Reply rules: ${channelRule} Acknowledge their point before anything else, never argue head-on, ask one question that makes them think, propose a low-commitment next step, never invent numbers or references. Write the reply in the same language as the lead's message; write what_they_mean and recommended_next_step in English. Set follow_up_in_days between 2 and 5 normally, 7 or more if the lead asked for time, 0 if a call is booked.`;
  }
  return `L'offre de l'utilisateur :\n\n${block}\n\nLe lead :\n${leadBlock}\n\nDernier message du lead (canal : ${args.channel}) :\n"""\n${args.message}\n"""\n\nTâches : identifie l'objection réelle derrière les mots et la température du lead ; explique en 1 à 2 phrases ce qu'il veut vraiment dire ; nomme la seule prochaine étape à viser (souvent un appel de 15 minutes ou une question qui clarifie) ; rédige la réponse à envoyer. Règles de la réponse : ${channelRule} Reconnais d'abord son point, ne contre-argumente jamais de front, pose une question qui le fait réfléchir, propose une prochaine étape à faible engagement, n'invente ni chiffres ni références. Rédige la réponse dans la même langue que le message du lead ; écris what_they_mean et recommended_next_step en français. follow_up_in_days : entre 2 et 5 normalement, 7 ou plus si le lead a demandé du temps, 0 si un appel est booké.`;
}
