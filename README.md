# Free Fall Fire Atlas

**NASA Space Apps Challenge 2026 · Flame in Free Fall**

An SI-powered web dashboard that turns NASA's microgravity combustion experiments (Physical Sciences Informatics, PSI) into fire-safety answers for a specific crew habitat.

## The problem

NASA has decades of fire experiments from the ISS and the Cygnus vehicle, but the results are hard to find, harder to compare, and harder to interpret. Meanwhile the habitats NASA is designing next are more flammable than the ISS: the Moon Base and pressurized rovers are expected to run at **30% oxygen or more at 10.2 psi or less**, so astronauts can suit up with less pre-breathing. Apollo 1 showed what oxygen-rich cabins can do. Engineers need to know which experiments apply to these atmospheres, and where the evidence runs out.

## What it does

1. **Describe a habitat.** Pick a preset (ISS/Orion, Moon Base, Pressurized Rover, Mars Transit, Earth) or set oxygen, pressure, airflow, gravity, fuels of concern and safety focus (prevention, detection, suppression).
2. **Ranked investigations.** 20 combustion investigations (BASS, BASS-II, Saffire I–III and IV–VI, SAME, SAME-R, DAFT, FLEX, FLEX-2, CFI, and the six ACME experiments, SPICE, SLICE) are scored for relevance to that habitat, with the reasons shown on each card.
3. **Evidence map.** Every investigation's test envelope is plotted on oxygen vs. airflow. The habitat appears as a crosshair, so empty space around it is a visible research gap.
4. **Fire-safety brief.** A rule-based interpreter writes a short brief: oxygen coverage gaps, the oxygen-fraction vs. partial-pressure effect, ventilation behaviour without buoyancy, the partial-gravity data gap, and detection and suppression lessons. Each statement names the studies it rests on.
5. **Ask the Atlas.** Free-text questions are answered by Claude, grounded only in the structured records and required to cite them. Citations become clickable chips that load the studies into the side-by-side comparison.
6. **Side-by-side comparison** of fuels, hardware, test conditions, measurements and safety relevance.

## Key insight the atlas surfaces

At the planned lunar atmosphere (30% O₂, 10.2 psi) the oxygen *partial pressure* is almost identical to Earth's, so it breathes like normal air. But the oxygen *fraction* is about 44% higher, and material flammability generally rises with oxygen concentration, with the size of the effect depending on material and pressure. ACME BRE showed emulated fuels self-extinguish in still air below about 25% O₂ yet burn for minutes above it, so oxygen-rich habitats lose the quiescent safety margin. The large-scale Saffire-IV–VI burns reach only about 29–31% O₂ at reduced pressure, and no solid-material data yet covers the 34% O₂ / 8.2 psia exploration atmosphere planned for rovers. That is the clearest gap between the data NASA has and the habitats NASA is building.

## PSI linkage

19 of the 20 investigation records are matched to their accession in NASA's PSI repository (BASS PSI-26, BASS-II PSI-25, Saffire-I/II/III PSI-98/99/100, SAME PSI-102, SAME-R PSI-101, DAFT PSI-47, FLEX PSI-69, FLEX-2 PSI-68, CFI PSI-39, ACME BRE PSI-20, CFI-G PSI-159, E-FIELD PSI-22, CLD PSI-21, Flame Design PSI-10, s-Flame PSI-23, SPICE PSI-107, SLICE PSI-106), retrieved from PSI's public investigation index. Saffire-IV–VI is not in PSI and comes from NASA technical reports. Each dashboard record links to its PSI page. Test-level PSI data files were not downloaded during the hackathon; that is the next step.

## How the SI works

- **Structured extraction layer:** each investigation is a record with objectives, fuels and geometry, O₂ range, pressure, airflow, hardware, measurements, a plain-language finding, an Earth application, and a confidence flag (`data/investigations.json`).
- **Relevance ranking:** weighted score of safety-pillar fit, fuel-phase match, oxygen proximity, airflow proximity and pressure proximity, plus context bonuses (spacecraft-scale fires, partial-gravity proxy).
- **Grounded generation:** `api/ask.js` sends the scenario and the records to Claude with a system prompt that forbids unsupported claims and requires `[ID]` citations. The server checks which cited IDs exist before returning them.

## Limitations

- The similarity distance is a heuristic measure of closeness to published test envelopes, not a validated flammability prediction. Variables inside a study's ranges may not have been tested together.
- Records are investigation-level metadata, not observation-level measurements; they support, but are not sufficient for, training predictive models.
- Test-by-test variables are listed only for the 9 investigations verified against NASA reports.
- Records marked NTRS were checked against NASA technical reports. Ranges marked ≈ are approximate envelopes still to be checked against each study's PSI documentation. Saffire-IV–VI data come from NTRS and may not yet be in PSI.
- PSI contains no partial-gravity combustion data yet (LUCI and FM2 are expected). Microgravity and 1 g results are reference cases only: combustion is nonlinear, so lunar and Mars behaviour cannot be assumed to fall between them.
- Rocket and propellant fires are outside the scope of PSI and of this tool.

## Run it

Static front end plus one serverless function.

```bash
npm i -g vercel
vercel env add ANTHROPIC_API_KEY   # your key, server-side only
vercel --prod
```

Without the key, the ranking, map, brief and comparison still work; only Ask the Atlas is disabled.

## Team

Danyib Núñez Rivera, Edanice, Deniel, Ian — Puerto Rico.

## License

Apache License 2.0. See `LICENSE` and `REFERENCES.md`.
