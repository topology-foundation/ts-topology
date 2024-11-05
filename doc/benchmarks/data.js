window.BENCHMARK_DATA = {
  "lastUpdate": 1730798669966,
  "repoUrl": "https://github.com/trungnotchung/ts-topology",
  "entries": {
    "Benchmark.js Benchmark": [
      {
        "commit": {
          "author": {
            "name": "trungnotchung",
            "username": "trungnotchung"
          },
          "committer": {
            "name": "trungnotchung",
            "username": "trungnotchung"
          },
          "id": "9535749cfd819dc083979ee4f02e575b22ae5be1",
          "message": "feat: add benchmark",
          "timestamp": "2024-11-05T09:09:49Z",
          "url": "https://github.com/trungnotchung/ts-topology/pull/4/commits/9535749cfd819dc083979ee4f02e575b22ae5be1"
        },
        "date": 1730797924812,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "Create HashGraph with 1000 vertices",
            "value": 252,
            "range": "±0.69%",
            "unit": "ops/sec",
            "extra": "90 samples"
          },
          {
            "name": "Create 2 CROs (1000 vertices each) and Merge",
            "value": 1.06,
            "range": "±2.27%",
            "unit": "ops/sec",
            "extra": "7 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "name": "trungnotchung",
            "username": "trungnotchung"
          },
          "committer": {
            "name": "trungnotchung",
            "username": "trungnotchung"
          },
          "id": "7f46a891b57e9f6d3b0a6716c30d26f54109afac",
          "message": "update benchmark workflow",
          "timestamp": "2024-11-05T09:12:33Z",
          "url": "https://github.com/trungnotchung/ts-topology/pull/5/commits/7f46a891b57e9f6d3b0a6716c30d26f54109afac"
        },
        "date": 1730798669029,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "Create HashGraph with 1000 vertices",
            "value": 254,
            "range": "±0.40%",
            "unit": "ops/sec",
            "extra": "90 samples"
          },
          {
            "name": "Create 2 CROs (1000 vertices each) and Merge",
            "value": 1.05,
            "range": "±2.37%",
            "unit": "ops/sec",
            "extra": "7 samples"
          }
        ]
      }
    ]
  }
}