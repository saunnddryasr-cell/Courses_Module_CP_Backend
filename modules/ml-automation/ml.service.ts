/**
 * CoursePur Backend — Lightweight ML & Statistical Automation (Part 12)
 */

import { db } from '../../shared/db/database.js';
import { Course, Institute, ExamTag } from '../../shared/types/schema.js';

export class MLAutomationService {
  static stringSimilarity(a: string, b: string): number {
    const s1 = a.toLowerCase().replace(/[^a-z0-9]/g, '');
    const s2 = b.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (s1 === s2) return 1.0;
    if (s1.length < 2 || s2.length < 2) return 0.0;

    const bigrams1 = new Set<string>();
    for (let i = 0; i < s1.length - 1; i++) bigrams1.add(s1.substring(i, i + 2));

    const bigrams2 = new Set<string>();
    for (let i = 0; i < s2.length - 1; i++) bigrams2.add(s2.substring(i, i + 2));

    let intersection = 0;
    for (const bg of bigrams1) if (bigrams2.has(bg)) intersection += 1;

    return (2.0 * intersection) / (bigrams1.size + bigrams2.size);
  }

  static findDuplicateInstitutes(name: string, city: string): { institute: Institute; similarity: number }[] {
    const matches: { institute: Institute; similarity: number }[] = [];
    for (const inst of db.institutes) {
      const cityMatch = inst.city.toLowerCase() === city.toLowerCase();
      const sim = this.stringSimilarity(inst.name, name);
      if ((cityMatch && sim >= 0.5) || sim >= 0.75) {
        matches.push({ institute: inst, similarity: Math.round(sim * 100) / 100 });
      }
    }
    return matches.sort((a, b) => b.similarity - a.similarity);
  }

  static scoreRelevance(query: string, title: string, description: string): number {
    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return 1.0;

    const t = title.toLowerCase();
    const d = description.toLowerCase();
    let score = 0;

    for (const tok of tokens) {
      if (t === tok) score += 10;
      else if (t.includes(tok)) score += 5;
      if (d.includes(tok)) score += 2;
    }
    return score;
  }

  static suggestExamTags(text: string): ExamTag[] {
    const lower = text.toLowerCase();
    return db.exam_tags.filter((tag) => lower.includes(tag.slug.toLowerCase()) || lower.includes(tag.name.toLowerCase()));
  }
}
