# Appendix B: Database Schema

## Tables (13 total)

1. **emotion_seeds**: Symbolische kennis (16 actieve seeds)
2. **unified_knowledge**: Hybrid cache (91 items)
3. **vector_embeddings**: Semantische zoekindex (426 embeddings)
4. **learning_queue**: Curation inbox (28 approved, 10 rejected)
5. **chat_messages**: Conversatiegeschiedenis
6. **decision_logs**: Elk AI-besluit gelogd
7. **api_collaboration_logs**: API usage tracking
8. **rubrics_assessments**: Therapeutische risicoscores
9. **reflection_logs**: Self-learning events (11 logs)
10. **seed_feedback**: User feedback op responses
11. **settings**: Configuratie (API keys, preferences)
12. **rubrics**: EvAI 5.6 rubric definities
13. **seed_rubrics**: Seed-rubric koppelingen

## RLS Policies

Alle tabellen hebben Row-Level Security. Single-user mode: `user_id = '00000000-0000-0000-0000-000000000001'`.

## Indexes

- HNSW vector index (pgvector)
- GIN indexes voor triggers, search_vector
- B-tree indexes voor timestamps

Zie `docs/supabase.sql` voor volledige schema.
