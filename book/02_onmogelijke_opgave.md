# Hoofdstuk 2: De Onmogelijke Opgave

> *"Als je niet kunt uitleggen wat je AI doet, hoe kun je dan vertrouwen dat het het juiste doet?"*

---

## 1. Het Black Box Probleem

Moderne AI-systemen zijn spectaculair goed in hun taak. GPT-4 kan essays schrijven, DALL-E maakt kunst, AlphaFold lost eiwitstructuren op. Maar er is één fundamenteel probleem:

**We begrijpen niet hoe ze werken.**

### Het Paradox van Succes

```
Accuraatheid ↑ → Parameters ↑ → Interpretabiliteit ↓
```

- **GPT-2** (2019): 1.5 miljard parameters → Nog enigszins te analyseren
- **GPT-3** (2020): 175 miljard parameters → Vrijwel onbegrijpelijk
- **GPT-4** (2023): ~1.7 biljoen parameters (geschat) → Volledige black box

Elke stap vooruit in performance is een stap achteruit in begrip.

---

## 2. Waarom Explainability Faalt

Explainable AI (XAI) probeert dit probleem op te lossen met post-hoc methoden. Maar deze hebben fundamentele beperkingen:

### 2.1 Attention Visualisatie

**Doel**: Laat zien welke woorden het model "belangrijk" vond.

```
Input: "Ik voel me angstig en alleen"
Attention: [0.32, 0.18, 0.27, 0.15, 0.08]
           [Ik   voel me  angstig en  alleen]
```

**Probleem**: 
- Vertelt **wat** het model zag, niet **waarom** het belangrijk is
- Attention is niet hetzelfde als redenering
- Meerdere attention heads kunnen conflicteren

### 2.2 Gradient-Based Methods (SHAP, LIME)

**Doel**: Bereken de "impact" van elk input feature.

**Probleem**:
- Gradiënten zijn **lokaal**: ze vertellen alleen over kleine veranderingen
- Niet stabiel: kleine perturbaties geven grote verschillen
- Computationeel duur: O(n²) voor LIME

### 2.3 Counterfactuals

**Doel**: "Als je dit had gezegd, had de AI dat geantwoord."

**Probleem**:
- Oneindig veel counterfactuals mogelijk
- Niet duidelijk welke **relevant** zijn
- Kan misleidend zijn (cherry-picking)

---

## 3. Het Therapeutische Dilemma

In de context van emotionele zorg is dit probleem extra urgent.

### Case Study: Crisis Detectie

```
User: "Ik kan niet meer, het heeft geen zin"

Black Box AI:
→ Output: "Het klinkt alsof je door een moeilijke tijd gaat. 
           Heb je overwogen om met een professional te praten?"

Vraag: Herkende de AI de crisis trigger ("geen zin")?
       Of was het een generiek antwoord?
       Zou het antwoord anders zijn bij "Ik ben moe"?
```

**We weten het niet.** En dat is gevaarlijk.

### De 5 Vragen die XAI Niet Beantwoordt

1. **Waarom** koos het systeem deze response?
2. **Welke kennis** werd gebruikt (en waar komt die vandaan)?
3. **Hoe zeker** is het systeem?
4. **Wat gebeurt er als** de context verandert?
5. **Wie is verantwoordelijk** als het misgaat?

---

## 4. De Literatuur: Wat Zeggen Onderzoekers?

### 4.1 The Mythos of Model Interpretability (Lipton, 2018)

> "We moeten onderscheid maken tussen **transparency** (hoe werkt het model) en **post-hoc interpretability** (wat deed het model in dit geval)."

Lipton stelt dat veel XAI-methoden **post-hoc** zijn: ze proberen achteraf uit te leggen wat een black box deed. Maar dit is niet hetzelfde als **transparency**: begrijpen hoe het model fundamenteel werkt.

### 4.2 Attention is Not Explanation (Jain & Wallace, 2019)

Deze paper toont aan dat attention weights **niet correleren** met feature importance. Je kunt de attention compleet veranderen zonder de output te veranderen.

**Implicatie**: Attention visualisaties zijn misleidend.

### 4.3 The False Promise of Counterfactuals (Barocas et al., 2020)

Counterfactuals zijn niet uniek. Voor elke output zijn er talloze input-wijzigingen die tot dezelfde output leiden. Dit maakt ze **arbitrair** als verklaring.

---

## 5. Waarom Dit Niet Werkt voor Therapy

Therapeutische AI heeft unieke eisen:

### 5.1 Accountability

Als een AI iemand adviseert om "niet te piekeren", moet je kunnen aantonen:
- Waarom dit advies therapeutisch verantwoord is
- Welke evidence-based principes werden toegepast
- Hoe de context (emotie, geschiedenis) werd meegewogen

**XAI kan dit niet.**

### 5.2 Trust

Gebruikers moeten kunnen vertrouwen dat de AI:
- Hun emotie correct herkent
- Geen bias heeft
- Crisis situaties serieus neemt

**Black boxes vragen blind vertrouwen.**

### 5.3 Adaptation

Therapie is iteratief. Een therapeut past zijn aanpak aan op basis van feedback. Een AI moet kunnen **uitleggen wat het geleerd heeft**.

**Post-hoc XAI is statisch.**

---

## 6. De Oplossing: Neurosymbolic AI

Als post-hoc explainability niet werkt, moeten we het anders aanpakken:

### Van Black Box naar White Box

| Black Box | White Box (Neurosymbolic) |
|-----------|---------------------------|
| Leer alles uit data | Combineer data met kennis |
| Geen structuur | Gelaagde modules |
| Post-hoc verklaring | Native transparency |
| Eén groot model | Meerdere specialisten |
| Impliciete logica | Expliciete regels + neurale flexibiliteit |

### Het Neurosymbolische Paradigma

```
Symbolic AI: Regels, logica, uitlegbaar maar rigide
    ↕
Neural AI: Flexibel, data-driven, maar black box
    ↕
Neurosymbolic: Combineer beide → Uitlegbaar én flexibel
```

---

## 7. Wat Neurosymbolisch Betekent

### 7.1 Symbolische Component

**Kennis in de vorm van structuren**:
- Emotion seeds: "Als gebruiker 'angstig' zegt → valideer emotie"
- Regels: "Bij crisis trigger → escaleer naar professioneel"
- Rubrics: "Score risico op 5 therapeutische dimensies"

### 7.2 Neurale Component

**Flexibiliteit en patroonherkenning**:
- Semantische zoekacties (vector embeddings)
- Emotie-detectie via transformer models
- GPT fallback voor edge cases

### 7.3 De Hybride

**Het beste van beide werelden**:
- Symbolisch geeft **structuur en uitlegbaarheid**
- Neuraal geeft **flexibiliteit en generalisatie**
- Hybrid ranking combineert beide scores

---

## 8. Waarom Dit De Onmogelijke Opgave Maakt Mogelijk

### Voor Neurosymbolic:
```
Vraag: Waarom deze response?
Antwoord: "Geen idee, het model deed het gewoon."
```

### Na Neurosymbolic:
```
Vraag: Waarom deze response?
Antwoord: 
  - Symbolische match: 85% (trigger: "angstig")
  - Semantische similarity: 78% (vector vergelijking)
  - Browser ML boost: 62% (sentiment: negative)
  - Rubrics relevantie: 90% (hoge emotional distress)
  → Finale score: 80%
```

**Dit is transparantie.**

---

## 9. De Prijs van Transparantie

Neurosymbolische systemen zijn **niet perfect**. Er zijn trade-offs:

### Wat Je Wint:
- ✅ Uitlegbaarheid
- ✅ Vertrouwen
- ✅ Controle
- ✅ Debugbaarheid

### Wat Het Kost:
- ⚠️ Minder "magisch" (je ziet de grenzen)
- ⚠️ Meer onderhoud (seeds/regels updaten)
- ⚠️ Lagere peak performance (pure GPT-4 scoort hoger op benchmarks)
- ⚠️ Complexiteit (7 lagen vs. 1 API call)

Maar voor therapeutische AI is deze trade-off **de moeite waard**. Veiligheid en vertrouwen zijn belangrijker dan peak performance.

---

## 10. De Onmogelijke Opgave Hergedefinieerd

Het echte probleem is niet:

> "Hoe maken we AI uitlegbaar?"

Maar:

> "Hoe bouwen we AI die van nature uitlegbaar is?"

Dit vereist een fundamenteel andere architectuur. Niet één groot model, maar een **gelaagd systeem** waarbij elke laag een specifieke functie heeft en aantoonbaar is.

In de volgende hoofdstukken laat ik zien hoe ik dit gebouwd heb.

---

## Reflectie: Wat Ik Geleerd Heb

De grootste les: **Transparantie is geen feature, het is een architecturele keuze.**

Je kunt het niet "toevoegen" aan een black box. Je moet het **inbouwen** vanaf dag één. Dat betekent:
- Kleinere, gespecialiseerde modules in plaats van één groot model
- Expliciete kennisrepresentatie (seeds, regels)
- Logging en traceability op elk niveau
- Hybride redenering (symbolisch + neuraal)

Het is meer werk. Maar het is de enige manier om AI te bouwen die we kunnen **vertrouwen**.

---

**Vorige**: [H1 - De Vonk](01_vonk_why.md)  
**Volgende**: [H3 - De Hypothese](03_hypothese_layers.md)
