"""Writes a tiny 2-unit topic-mode demo so you can try the build without any materials.

python examples/demo-topic/make_demo.py
python skills/study-atlas/scripts/build.py examples/demo-topic demo.html
"""
import json, os
D = os.path.dirname(os.path.abspath(__file__))
course = {
  "meta": {"title": "Time Value of Money", "code": "DEMO", "subtitle": "A two-topic demo of the Study Atlas format.",
           "unitName": "Topic", "mode": "topic", "exam": {"count": 6, "minutes": 10, "desc": "Demo only: a short mixed quiz."},
           "sourceNote": "Demo built from standard finance formulas, not from any course's materials."},
  "sources": {},
  "themes": {"t1": ["Single sums", "T1"], "t2": ["Streams of cash", "T2"]},
  "seq": [{"t": "Finding a present value", "w": 1, "i": ["Identify the future amount", "Choose the discount rate", "Count the periods", "Divide by (1 + r) to the power n"]}],
  "lists": [{"t": "Inputs to a single-sum PV", "w": 1, "i": [["Future value", "future|fv"], ["Rate", "rate|r\\b"], ["Number of periods", "period|year|n\\b"]]}],
  "pairs": [["Present value", "Today's worth of a future amount"], ["Future value", "What money grows to at a given rate"],
            ["Discount rate", "Rate used to bring future cash back to today"], ["Annuity", "Equal payments for a fixed number of periods"],
            ["Perpetuity", "Equal payments forever"], ["APR", "Quoted annual rate before compounding"], ["EAR", "Annual rate after compounding"]],
  "nums": [["PV of $1,000 in 10 years at 8%", "$463.19", 1], ["FV of $1,000 after 10 years at 5%", "$1,628.89", 1],
           ["Rule of 72 at 8%", "About 9 years to double", 1], ["EAR of 12% APR compounded monthly", "12.68%", 2],
           ["PV of $100 a year for 10 years at 8%", "$671.01", 2]],
  "confuse": [["APR vs EAR", "APR is the quoted rate; EAR includes compounding, so EAR ≥ APR."]],
  "threads": [{"t": "Discount rate", "w": [1, 2], "d": "Discounts a single sum in Topic 1, then every payment of an annuity in Topic 2."}],
  "flags": [],
  "sorts": [{"t": "Annuity or perpetuity?", "w": 2, "cats": ["Annuity", "Perpetuity"],
             "items": [["A 30-year mortgage", 0], ["A preferred share paying a fixed dividend forever", 1], ["A 5-year car loan", 0], ["A UK consol bond with no maturity", 1]]}],
  "trees": [],
  "calcs": [{"t": "Present value of a single sum", "w": 1,
             "inputs": [{"id": "fv", "label": "Future value ($)", "type": "number", "value": 1000, "min": 0, "step": 50},
                        {"id": "r", "label": "Rate", "unit": "%", "min": 0, "max": 20, "step": 0.5, "value": 8},
                        {"id": "n", "label": "Years", "min": 1, "max": 40, "value": 10}],
             "out": "`PV = $${fmt(fv/Math.pow(1+r/100,n))}`"}]
}
u1 = {"n": 1, "th": "t1", "title": "Present and future value", "short": "PV and FV",
      "idea": "Money now is worth more than the same money later, because it can earn a return in the meantime.",
      "sections": [{"h": "Future value", "b": "<p><b>Future value</b>: FV = PV × (1 + r)<sup>n</sup>. $1,000 at 5% for 10 years grows to <b>$1,628.89</b>.</p>"},
                   {"h": "Present value", "b": "<p><b>Present value</b> reverses it: PV = FV / (1 + r)<sup>n</sup>. $1,000 in 10 years at 8% is worth <b>$463.19</b> today.</p><div data-widget='calc:0'></div><p class='memo'>Memory hook: the <b>Rule of 72</b>. Years to double ≈ 72 / rate in %.</p>"}],
      "traps": ["Use the rate per period: a monthly problem needs a monthly rate and months."],
      "map": [["Future value", "Compounding forward", [["FV formula", "PV × (1+r)^n"], ["Rule of 72", "Years to double ≈ 72 / r%"]]],
              ["Present value", "Discounting back", [["PV formula", "FV / (1+r)^n"], ["Discount rate", "The return you give up"]]]],
      "cards": [["What does discounting do?", "Turns a future amount into today's value."], ["Rule of 72?", "Years to double ≈ 72 divided by the % rate."],
                ["FV formula?", "FV = PV × (1 + r)^n"], ["PV formula?", "PV = FV / (1 + r)^n"], ["Why is money now worth more?", "It can earn a return meanwhile."],
                ["Higher rate, lower or higher PV?", "Lower PV."]],
      "mcq": [["$1,000 received in 10 years, discounted at 8%, is worth today about:", ["$463", "$500", "$926", "$2,159"], 0, "1,000 / 1.08^10 = 463.19.", ""],
              ["If the discount rate rises, the present value of a fixed future payment:", ["Falls", "Rises", "Stays the same", "Doubles"], 0, "A bigger denominator gives a smaller PV.", ""],
              ["At 6% a year, money doubles in roughly:", ["12 years", "6 years", "8 years", "18 years"], 0, "Rule of 72: 72 / 6 = 12.", ""],
              ["$1,000 at 5% for 10 years grows to about:", ["$1,629", "$1,500", "$1,050", "$2,000"], 0, "1,000 × 1.05^10 = 1,628.89.", ""],
              ["Which formula gives the future value of a single sum?", ["PV × (1 + r)^n", "PV / (1 + r)^n", "C / r", "PV × r × n"], 0, "Compounding forward multiplies by the growth factor (1 + r)^n.", ""],
              ["FV / (1 + r)^n calculates:", ["Present value", "Future value", "An annuity payment", "The EAR"], 0, "Dividing by the growth factor discounts back to today.", ""]],
      "hl": [],
      "num": [["What is $1,000 in 10 years worth today at 8%?", ["$463.19", "$500.00", "$680.58", "$925.93"], "1,000 / 1.08^10 = 463.19.", ""],
              ["Using the Rule of 72, how long does money take to double at 8%?", ["About 9 years", "About 8 years", "About 12 years", "About 7 years"], "72 / 8 = 9.", ""]]}
u2 = {"n": 2, "th": "t2", "title": "Annuities and interest rates", "short": "Annuities and rates",
      "idea": "Most real cash flows are streams, not single sums, and quoted rates hide compounding.",
      "sections": [{"h": "Annuities", "b": "<p>An <b>annuity</b> pays equal amounts for a fixed term. PV = C × [1 − (1 + r)<sup>−n</sup>] / r. $100 a year for 10 years at 8% is worth <b>$671.01</b>.</p><div data-widget='sort:0'></div>"},
                   {"h": "APR and EAR", "b": "<p>The <b>EAR</b> includes compounding: EAR = (1 + APR/m)<sup>m</sup> − 1. A 12% APR compounded monthly is an EAR of <b>12.68%</b>.</p>"}],
      "traps": ["A perpetuity's PV is C / r: no n, because it never ends."],
      "map": [["Annuities", "Equal payments, fixed term", [["PV of annuity", "C × [1 − (1+r)^−n] / r"], ["Perpetuity", "C / r"]]],
              ["Rates", "Quoted vs effective", [["APR", "Quoted, before compounding"], ["EAR", "After compounding"]]]],
      "cards": [["PV of a perpetuity?", "C / r"], ["What is an annuity?", "Equal payments for a fixed number of periods."], ["EAR formula?", "(1 + APR/m)^m − 1"],
                ["Is EAR ever below APR?", "No. With compounding it is at least as large."], ["12% APR monthly, EAR?", "12.68%"], ["Example of a perpetuity?", "A fixed dividend paid forever, such as a preferred share."]],
      "mcq": [["The present value of $100 a year for 10 years at 8% is about:", ["$671", "$1,000", "$463", "$800"], 0, "100 × [1 − 1.08^−10] / 0.08 = 671.01.", ""],
              ["A 12% APR compounded monthly has an EAR of about:", ["12.68%", "12.00%", "1.00%", "13.50%"], 0, "(1.01)^12 − 1 = 12.68%.", ""],
              ["The PV of a perpetuity paying $50 a year at 5% is:", ["$1,000", "$250", "$2,500", "$500"], 0, "C / r = 50 / 0.05 = 1,000.", ""],
              ["Which pays equal amounts forever?", ["Perpetuity", "Annuity", "Zero-coupon bond", "Single sum"], 0, "A perpetuity has no end date.", ""],
              ["More frequent compounding at the same APR makes the EAR:", ["Higher", "Lower", "Unchanged", "Negative"], 0, "Interest earns interest more often.", ""],
              ["A 30-year mortgage with fixed monthly payments is:", ["An annuity", "A perpetuity", "A single sum", "A growing perpetuity"], 0, "Equal payments for a fixed term.", ""]],
      "hl": [],
      "num": [["What is the EAR of a 12% APR compounded monthly?", ["12.68%", "12.00%", "12.36%", "12.55%"], "(1 + 0.12/12)^12 − 1 = 12.68%.", ""],
              ["What is the PV of $100 a year for 10 years at 8%?", ["$671.01", "$1,000.00", "$740.99", "$613.91"], "100 × [1 − 1.08^−10] / 0.08 = 671.01.", ""]]}
os.makedirs(os.path.join(D, "units"), exist_ok=True)
json.dump(course, open(os.path.join(D, "course.json"), "w", encoding="utf8"), ensure_ascii=False, indent=1)
for u in (u1, u2):
    json.dump(u, open(os.path.join(D, "units", f"{u['n']:02d}.json"), "w", encoding="utf8"), ensure_ascii=False, indent=1)
print("demo written to", D)
