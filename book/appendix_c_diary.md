# Appendix C: Developer's Diary

## v3.0: De Symbolische Fase (Gefaald)

Pure rule-based systeem. Te rigide, geen generalisatie. **Les: Symbolisch alleen is niet genoeg.**

## v4.0: De pgvector Doorbraak

Toevoegen van semantic search. Performance sprong van 200ms naar 5ms met HNSW index. **Les: De juiste datastructuur maakt alles.**

## v5.0: Rubrics Te Streng

Eerste rubrics implementatie blokkeerde 40% van legitieme input. Moesten "flexible" mode toevoegen. **Les: Defaults zijn belangrijk.**

## v5.6: Browser ML Crash

Firefox kon model niet downloaden (CORS issue). Moesten fallback toevoegen. **Les: Altijd graceful degradation.**

## v5.6+: Self-Learning Werkt

74% approval rate op AI-generated seeds. Menselijke curatie blijft essentieel. **Les: Human-in-the-loop is geen compromis, het is kwaliteit.**
