// 대학 진학률 (시도별) — 자동생성 (scripts/fetch-admission-rate.mjs)
// 출처: 한국교육개발원 교육통계 "시도 시군구별 졸업자 진학자 진학률"
//   (공공데이터포털 15053808 / api.odcloud.kr). 시군구 가중집계.
// 진학률 = 진학자/졸업자×100. 수동편집 금지.
export interface AdmissionSido { sido: string; latest: number; series: { year: number; rate: number }[] }
export const ADMISSION_YEARS = [2022,2023,2024,2025];
export const ADMISSION_LATEST_YEAR = 2025;
export const ADMISSION_NATIONAL_LATEST = 74.4;
export const ADMISSION_SIDO: AdmissionSido[] = [
 {
  "sido": "경남",
  "latest": 82.9,
  "series": [
   {
    "year": 2022,
    "rate": 81
   },
   {
    "year": 2023,
    "rate": 82.3
   },
   {
    "year": 2024,
    "rate": 82.9
   },
   {
    "year": 2025,
    "rate": 82.9
   }
  ]
 },
 {
  "sido": "광주",
  "latest": 81.7,
  "series": [
   {
    "year": 2022,
    "rate": 81.4
   },
   {
    "year": 2023,
    "rate": 81.5
   },
   {
    "year": 2024,
    "rate": 82
   },
   {
    "year": 2025,
    "rate": 81.7
   }
  ]
 },
 {
  "sido": "세종",
  "latest": 81.7,
  "series": [
   {
    "year": 2022,
    "rate": 80.4
   },
   {
    "year": 2023,
    "rate": 78.6
   },
   {
    "year": 2024,
    "rate": 80.1
   },
   {
    "year": 2025,
    "rate": 81.7
   }
  ]
 },
 {
  "sido": "전남",
  "latest": 81.4,
  "series": [
   {
    "year": 2022,
    "rate": 76.8
   },
   {
    "year": 2023,
    "rate": 78.5
   },
   {
    "year": 2024,
    "rate": 79.8
   },
   {
    "year": 2025,
    "rate": 81.4
   }
  ]
 },
 {
  "sido": "울산",
  "latest": 79.4,
  "series": [
   {
    "year": 2022,
    "rate": 79.9
   },
   {
    "year": 2023,
    "rate": 78.3
   },
   {
    "year": 2024,
    "rate": 79.3
   },
   {
    "year": 2025,
    "rate": 79.4
   }
  ]
 },
 {
  "sido": "강원",
  "latest": 79.3,
  "series": [
   {
    "year": 2022,
    "rate": 78.8
   },
   {
    "year": 2023,
    "rate": 78
   },
   {
    "year": 2024,
    "rate": 79.2
   },
   {
    "year": 2025,
    "rate": 79.3
   }
  ]
 },
 {
  "sido": "전북",
  "latest": 79,
  "series": [
   {
    "year": 2022,
    "rate": 77.6
   },
   {
    "year": 2023,
    "rate": 77.7
   },
   {
    "year": 2024,
    "rate": 77
   },
   {
    "year": 2025,
    "rate": 79
   }
  ]
 },
 {
  "sido": "경북",
  "latest": 78.9,
  "series": [
   {
    "year": 2022,
    "rate": 78.3
   },
   {
    "year": 2023,
    "rate": 77.3
   },
   {
    "year": 2024,
    "rate": 79.2
   },
   {
    "year": 2025,
    "rate": 78.9
   }
  ]
 },
 {
  "sido": "대전",
  "latest": 78.5,
  "series": [
   {
    "year": 2022,
    "rate": 76.7
   },
   {
    "year": 2023,
    "rate": 76.6
   },
   {
    "year": 2024,
    "rate": 76.8
   },
   {
    "year": 2025,
    "rate": 78.5
   }
  ]
 },
 {
  "sido": "제주",
  "latest": 78,
  "series": [
   {
    "year": 2022,
    "rate": 76.1
   },
   {
    "year": 2023,
    "rate": 76.6
   },
   {
    "year": 2024,
    "rate": 78.7
   },
   {
    "year": 2025,
    "rate": 78
   }
  ]
 },
 {
  "sido": "충북",
  "latest": 77.8,
  "series": [
   {
    "year": 2022,
    "rate": 76.6
   },
   {
    "year": 2023,
    "rate": 75.1
   },
   {
    "year": 2024,
    "rate": 76.4
   },
   {
    "year": 2025,
    "rate": 77.8
   }
  ]
 },
 {
  "sido": "대구",
  "latest": 77.1,
  "series": [
   {
    "year": 2022,
    "rate": 79.3
   },
   {
    "year": 2023,
    "rate": 75.1
   },
   {
    "year": 2024,
    "rate": 76.2
   },
   {
    "year": 2025,
    "rate": 77.1
   }
  ]
 },
 {
  "sido": "부산",
  "latest": 76.8,
  "series": [
   {
    "year": 2022,
    "rate": 78
   },
   {
    "year": 2023,
    "rate": 77.8
   },
   {
    "year": 2024,
    "rate": 75.9
   },
   {
    "year": 2025,
    "rate": 76.8
   }
  ]
 },
 {
  "sido": "충남",
  "latest": 75.6,
  "series": [
   {
    "year": 2022,
    "rate": 73.8
   },
   {
    "year": 2023,
    "rate": 74.7
   },
   {
    "year": 2024,
    "rate": 75
   },
   {
    "year": 2025,
    "rate": 75.6
   }
  ]
 },
 {
  "sido": "인천",
  "latest": 74.5,
  "series": [
   {
    "year": 2022,
    "rate": 73.5
   },
   {
    "year": 2023,
    "rate": 74.4
   },
   {
    "year": 2024,
    "rate": 74.3
   },
   {
    "year": 2025,
    "rate": 74.5
   }
  ]
 },
 {
  "sido": "경기",
  "latest": 72.9,
  "series": [
   {
    "year": 2022,
    "rate": 71.4
   },
   {
    "year": 2023,
    "rate": 71.1
   },
   {
    "year": 2024,
    "rate": 71.7
   },
   {
    "year": 2025,
    "rate": 72.9
   }
  ]
 },
 {
  "sido": "서울",
  "latest": 62,
  "series": [
   {
    "year": 2022,
    "rate": 61.3
   },
   {
    "year": 2023,
    "rate": 59.5
   },
   {
    "year": 2024,
    "rate": 61.3
   },
   {
    "year": 2025,
    "rate": 62
   }
  ]
 }
];
