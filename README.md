# Free Fall Fire Atlas

**NASA Space Apps Challenge 2026 · Flame in Free Fall**

An SI-powered web dashboard that turns NASA's microgravity combustion experiments (Physical Sciences Informatics, PSI) into fire-safety answers for a specific crew habitat.

## The problem

NASA has decades of fire experiments from the ISS and the Cygnus vehicle, but the results are hard to find, harder to compare, and harder to interpret. Meanwhile the habitats NASA is designing next are more flammable than the ISS: the Moon Base and pressurized rovers are expected to run at **30% oxygen or more at 10.2 psi or less**, so astronauts can suit up with less pre-breathing. Apollo 1 showed what oxygen-rich cabins can do. Engineers need to know which experiments apply to these atmospheres, and where the evidence runs out.

## What it does

1. **Describe a habitat.** Pick a preset (ISS/Orion, Moon Base, Pressurized Rover, Mars Transit, Earth) or set oxygen, pressure, airflow, gravity, fuels of concern and safety focus (prevention, detection, suppression).
2. **Ranked investigations.** 19 PSI investigations (BASS, BASS-II, Saffire I–III, SAME, SAME-R, DAFT, FLEX, FLEX-2, CFI, and the six ACME experiments, SPICE, SLICE) are scored for relevance to that habitat, with the reasons shown on each card.
3. **Evidence map.** Every investigation's test envelope is plotted on oxygen vs. airflow. The habitat appears as a crosshair, so empty space around it is a visible research gap.
4. **Fire-safety brief.** A rule-based interpreter writes a short brief: oxygen coverage gaps, the oxygen-fraction vs. partial-pressure effect, ventilation behaviour without buoyancy, the partial-gravity data gap, and detection and suppression lessons. Each statement names the studies it rests on.
5. **Ask the Atlas.** Free-text questions are answered by Claude, grounded only in the structured records and required to cite them. Citations become clickable chips that load the studies into the side-by-side comparison.
6. **Side-by-side comparison** of fuels, hardware, test conditions, measurements and safety relevance.

## Key insight the atlas surfaces

At the planned lunar atmosphere (30% O₂, 10.2 psi) the oxygen *partial pressure* is almost identical to Earth's, so it breathes like normal air. But the oxygen *fraction* is ~44% higher, and flammability tracks the fraction. In the records compiled here, no solid-material (fabric, plastic) burn in PSI exceeds about 21% O₂. The only PSI flames above that level are gaseous (ACME CFI-G, up to 85% O₂). That is the single largest gap between the data NASA has and the habitats NASA is building.

## How the SI works

- **Structured extraction layer:** each investigation is a record with objectives, fuels and geometry, O₂ range, pressure, airflow, hardware, measurements, a plain-language finding, an Earth application, and a confidence flag (`data/investigations.json`).
- **Relevance ranking:** weighted score of safety-pillar fit, fuel-phase match, oxygen proximity, airflow proximity and pressure proximity, plus context bonuses (spacecraft-scale fires, partial-gravity proxy).
- **Grounded generation:** `api/ask.js` sends the scenario and the records to Claude with a system prompt that forbids unsupported claims and requires `[ID]` citations. The server checks which cited IDs exist before returning them.

## Limitations

- Ranges marked ≈ are approximate envelopes compiled for this hackathon and should be checked against each study's PSI documentation.
- PSI contains no partial-gravity combustion data yet (LUCI and FM2 are expected). Lunar and Mars behaviour is bounded between microgravity and 1 g.
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
