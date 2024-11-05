window.BENCHMARK_DATA = {
  "lastUpdate": 1730797926425,
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
      }
    ]
  }
}