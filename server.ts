import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

// Enable CORS for all incoming requests (crucial for iframe & external preview routing)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-admin-password"
  );
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// JSON and URL-encoded body parsers
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// Database file setup
const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");
const DB_BACKUP_FILE = path.join(DATA_DIR, "db.backup.json");

export interface GuestbookEntry {
  id: string;
  nickname: string;
  personalityType?: string;
  message: string;
  sticker: string;
  likes: number;
  createdAt: string;
}

export interface RankingRecord {
  id: string;
  nickname: string;
  timeSeconds: number;
  moves: number;
  createdAt: string;
}

export interface DatabaseSchema {
  guestbook: GuestbookEntry[];
  rankings: RankingRecord[];
}

const initialData: DatabaseSchema = {
  guestbook: [
    {
      id: "seed-1",
      nickname: "꿈꾸는별",
      personalityType: "apple",
      message: "미니유공방 부스 방문 완료! 성향 진단도 신기하고 미니어처 키트 체험 너무 유익했어요 ✨",
      sticker: "🍏",
      likes: 12,
      createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    },
    {
      id: "seed-2",
      nickname: "히어로",
      personalityType: "dragonfruit",
      message: "작가님들과 함께 미니어처 작품 만들어보는 시간 정말 특별했습니다! 전공 상담까지 알차게 받았어요 🎓",
      sticker: "🐉",
      likes: 9,
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    {
      id: "seed-3",
      nickname: "지우랑민서",
      personalityType: "strawberry",
      message: "친구랑 같이 와서 서로 진로 성향 맞춰봤어요! 카드 맞추기 랭킹전도 너무 재밌어요 파이팅 🍓",
      sticker: "🍓",
      likes: 8,
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    },
  ],
  rankings: [
    {
      id: "rank-sample-1",
      nickname: "순발력대장",
      timeSeconds: 15.2,
      moves: 10,
      createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    },
    {
      id: "rank-sample-2",
      nickname: "꿈꾸는별",
      timeSeconds: 18.4,
      moves: 12,
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
  ],
};

let memoryDb: DatabaseSchema | null = null;

function readDb(): DatabaseSchema {
  if (memoryDb) {
    return memoryDb;
  }

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      memoryDb = {
        guestbook: Array.isArray(parsed.guestbook) ? parsed.guestbook : initialData.guestbook,
        rankings: Array.isArray(parsed.rankings) ? parsed.rankings : initialData.rankings,
      };
      return memoryDb;
    }

    // Try backup if main file does not exist
    if (fs.existsSync(DB_BACKUP_FILE)) {
      const raw = fs.readFileSync(DB_BACKUP_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      memoryDb = {
        guestbook: Array.isArray(parsed.guestbook) ? parsed.guestbook : initialData.guestbook,
        rankings: Array.isArray(parsed.rankings) ? parsed.rankings : initialData.rankings,
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(memoryDb, null, 2), "utf-8");
      return memoryDb;
    }

    // Create new initial DB
    memoryDb = initialData;
    fs.writeFileSync(DB_FILE, JSON.stringify(memoryDb, null, 2), "utf-8");
    fs.writeFileSync(DB_BACKUP_FILE, JSON.stringify(memoryDb, null, 2), "utf-8");
    return memoryDb;
  } catch (err) {
    console.error("Failed to read DB, returning default data:", err);
    memoryDb = initialData;
    return memoryDb;
  }
}

function writeDb(data: DatabaseSchema): void {
  try {
    memoryDb = data;
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    const serialized = JSON.stringify(data, null, 2);
    // Write directly to DB file
    fs.writeFileSync(DB_FILE, serialized, "utf-8");
    // Also save backup synchronously
    fs.writeFileSync(DB_BACKUP_FILE, serialized, "utf-8");
  } catch (err) {
    console.error("Failed to write to DB:", err);
  }
}

// Lazy Gemini Client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiClient;
}

// --- API Endpoints ---
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Guestbook APIs
app.get("/api/guestbook", (_req, res) => {
  try {
    const db = readDb();
    // Return sorted by most recent
    const sorted = [...db.guestbook].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    res.json(sorted);
  } catch (err) {
    console.error("GET /api/guestbook error:", err);
    res.status(500).json({ error: "방명록 목록을 불러오지 못했습니다." });
  }
});

app.post("/api/guestbook", (req, res) => {
  try {
    const { nickname, personalityType, message, sticker } = req.body || {};
    const cleanNick = String(nickname || "").trim();
    const cleanMsg = String(message || "").trim();

    if (!cleanNick) {
      return res.status(400).json({ success: false, error: "닉네임을 입력해주세요." });
    }
    if (!cleanMsg) {
      return res.status(400).json({ success: false, error: "방문 소감 또는 메시지를 입력해주세요." });
    }

    const db = readDb();
    const newEntry: GuestbookEntry = {
      id: `guest-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      nickname: cleanNick.slice(0, 15),
      personalityType: personalityType || "apple",
      message: cleanMsg.slice(0, 300),
      sticker: sticker || "💖",
      likes: 0,
      createdAt: new Date().toISOString(),
    };

    // Store at beginning
    db.guestbook.unshift(newEntry);
    // Keep generous history for event (up to 5,000 records)
    if (db.guestbook.length > 5000) {
      db.guestbook = db.guestbook.slice(0, 5000);
    }
    writeDb(db);

    return res.status(201).json({ success: true, item: newEntry, totalCount: db.guestbook.length });
  } catch (err: any) {
    console.error("POST /api/guestbook error:", err);
    return res.status(500).json({ success: false, error: err?.message || "방명록 저장 중 오류가 발생했습니다." });
  }
});

app.post("/api/guestbook/:id/like", (req, res) => {
  try {
    const { id } = req.params;
    const db = readDb();
    const entry = db.guestbook.find((e) => e.id === id);
    if (!entry) {
      return res.status(404).json({ success: false, error: "방명록을 찾을 수 없습니다." });
    }

    entry.likes = (entry.likes || 0) + 1;
    writeDb(db);
    return res.json({ success: true, likes: entry.likes });
  } catch (err: any) {
    console.error("POST /api/guestbook/:id/like error:", err);
    return res.status(500).json({ success: false, error: "좋아요 처리에 실패했습니다." });
  }
});

// Admin verify & delete guestbook item
app.delete("/api/guestbook/:id", (req, res) => {
  try {
    const { id } = req.params;
    const adminPassword =
      req.headers["x-admin-password"] ||
      req.query.password ||
      (req.body && req.body.password);

    if (adminPassword !== "0410") {
      return res.status(401).json({ success: false, error: "관리자 인증에 실패했습니다." });
    }

    const db = readDb();
    const index = db.guestbook.findIndex((e) => e.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: "해당 방명록 항목을 찾을 수 없습니다." });
    }

    const deletedItem = db.guestbook.splice(index, 1)[0];
    writeDb(db);
    return res.json({ success: true, message: "방명록이 삭제되었습니다.", deletedId: deletedItem.id });
  } catch (err: any) {
    console.error("DELETE /api/guestbook/:id error:", err);
    return res.status(500).json({ success: false, error: "방명록 삭제 중 오류가 발생했습니다." });
  }
});

// Rankings APIs
app.get("/api/rankings", (req, res) => {
  try {
    const db = readDb();
    const limit = req.query.limit ? Math.min(Number(req.query.limit) || 50, 200) : 50;
    // Sort by time (ascending: fastest first)
    const sorted = [...db.rankings].sort((a, b) => a.timeSeconds - b.timeSeconds);
    return res.json(sorted.slice(0, limit));
  } catch (err) {
    console.error("GET /api/rankings error:", err);
    return res.status(500).json({ error: "랭킹 데이터를 불러오지 못했습니다." });
  }
});

app.post("/api/rankings", (req, res) => {
  try {
    const { nickname, timeSeconds, moves } = req.body || {};
    const parsedTime = Number(timeSeconds);

    if (isNaN(parsedTime) || parsedTime <= 0) {
      return res.status(400).json({ success: false, error: "올바른 기록 시간(초)이 필요합니다." });
    }

    const cleanNick = String(nickname || "").trim() || "참가자";

    const db = readDb();
    const newRecord: RankingRecord = {
      id: `rank-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      nickname: cleanNick.slice(0, 15),
      timeSeconds: Math.round(parsedTime * 10) / 10,
      moves: Math.max(1, Number(moves) || 0),
      createdAt: new Date().toISOString(),
    };

    db.rankings.push(newRecord);
    // Sort ascending by time
    db.rankings.sort((a, b) => a.timeSeconds - b.timeSeconds);

    // Keep generous participant history for the entire expo (up to 3,000 records)
    if (db.rankings.length > 3000) {
      db.rankings = db.rankings.slice(0, 3000);
    }
    writeDb(db);

    const myRank = db.rankings.findIndex((r) => r.id === newRecord.id) + 1;
    const top50 = db.rankings.slice(0, 50);

    return res.status(201).json({
      success: true,
      rank: myRank,
      record: newRecord,
      rankings: top50,
      totalParticipants: db.rankings.length,
    });
  } catch (err: any) {
    console.error("POST /api/rankings error:", err);
    return res.status(500).json({ success: false, error: err?.message || "랭킹 등록 중 오류가 발생했습니다." });
  }
});

// Admin delete ranking record
app.delete("/api/rankings/:id", (req, res) => {
  try {
    const { id } = req.params;
    const adminPassword =
      req.headers["x-admin-password"] ||
      req.query.password ||
      (req.body && req.body.password);

    if (adminPassword !== "0410") {
      return res.status(401).json({ success: false, error: "관리자 인증에 실패했습니다." });
    }

    const db = readDb();
    const index = db.rankings.findIndex((e) => e.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: "해당 랭킹 항목을 찾을 수 없습니다." });
    }

    const deletedItem = db.rankings.splice(index, 1)[0];
    writeDb(db);
    return res.json({ success: true, message: "랭킹 기록이 삭제되었습니다.", deletedId: deletedItem.id });
  } catch (err: any) {
    console.error("DELETE /api/rankings/:id error:", err);
    return res.status(500).json({ success: false, error: "랭킹 삭제 중 오류가 발생했습니다." });
  }
});

// Database stats for event monitoring
app.get("/api/stats", (_req, res) => {
  const db = readDb();
  res.json({
    totalGuestbook: db.guestbook.length,
    totalRankings: db.rankings.length,
    fastestTime: db.rankings.length > 0 ? Math.min(...db.rankings.map((r) => r.timeSeconds)) : null,
    time: new Date().toISOString(),
  });
});

// Gemini-powered personalized description
app.post("/api/generate-description", async (req, res) => {
  const { nickname, type } = req.body || {};
  const cleanNick = String(nickname || "방문자").slice(0, 12).trim();

  // Encouraging mentor quotes pool for youth (4 per fruit type)
  const mentorQuotesPool: Record<string, string[]> = {
    apple: [
      `${cleanNick}님, 남들과 다른 독창적인 생각은 결코 엉뚱한 게 아니에요. 세상을 더 새롭고 아름답게 바꿀 눈부신 시작이에요! 🍏✨`,
      `${cleanNick}님의 머릿속에 떠오른 작은 아이디어 하나가 언젠가 세상을 깜짝 놀라게 할 멋진 작품이 될 거예요. 특별한 감각을 믿어보세요! 🎨`,
      `${cleanNick}님, 정해진 틀에 갇히지 마세요. 그리는 세상이 곧 새로운 길이 되고 상상력은 무한한 힘을 품고 있어요! 🌿💫`,
      `${cleanNick}님은 주변 시선에 흔들리지 않고 자신만의 시선으로 세상을 바라보는 빛나는 크리에이터예요! 🌟`,
    ],
    dragonfruit: [
      `${cleanNick}님, 남들의 기준에 맞추려 하지 마세요. 깃든 독보적인 색깔 자체가 세상에 단 하나뿐인 강력한 무기예요! 🐉🔥`,
      `${cleanNick}님, 새로운 길을 먼저 개척하는 건 외로울 때도 있지만, 그 길의 맨 앞에서 세상을 리드할 주인공은 바로 당신이에요! 💖`,
      `${cleanNick}님의 거침없는 용기는 이미 많은 친구들에게 영감을 주고 있어요. 오늘도 당당하게 직진해보세요! 🚀`,
      `${cleanNick}님, 세상은 평범함보다 용기 있게 자신을 표현하는 사람을 기억해요. 뜨거운 열정으로 멋지게 날아올라봐요! ✨`,
    ],
    blueberry: [
      `${cleanNick}님, 지금의 깊은 고민과 배움의 시간들은 헛되지 않아요. 차곡차곡 쌓인 지식이 미래의 단단한 날개가 되어줄 거예요! 🫐💡`,
      `${cleanNick}님, 묵묵히 원리를 파고들고 답을 찾아가는 끈기는 어떤 어려운 벽도 지혜롭게 풀어낼 최고의 힘이에요! 📚✨`,
      `${cleanNick}님, 조급해하지 않아도 돼요. 자신만의 속도로 다져온 생각의 깊이가 머지않아 큰 혁신을 만들어낼 테니까요! 🔍💎`,
      `${cleanNick}님, 세상의 소음 속에서도 본질을 꿰뚫어 보는 명석한 눈동자가 정말 멋져요. 지적 호기심을 마음껏 펼쳐보세요! 🔭`,
    ],
    grapefruit: [
      `${cleanNick}님, 솔직하고 당당한 매력은 사람들의 마음을 단숨에 사로잡는 마법이에요. 개성 있는 목소리와 센스를 절대 숨기지 마세요! 🍊✨`,
      `${cleanNick}님, 때로는 톡 쏘는 당당함과 거침없는 행동력이 막힌 상황을 시원하게 뚫어내는 열쇠가 돼요. 멋지게 무대를 만들어가요! 💫`,
      `${cleanNick}님, 누군가의 눈치를 보기보다 자신을 아끼고 솔직하게 표현할 줄 아는 당신은 어디서나 빛나는 주인공이에요! 🌟`,
      `${cleanNick}님의 번뜩이는 감각과 트렌디한 안목은 정말 특별해요. 직관을 믿고 가슴 뛰는 꿈을 향해 과감하게 나아가세요! 💖`,
    ],
    banana: [
      `${cleanNick}님의 환한 미소와 긍정적인 에너지는 주변 친구들에게 가장 따뜻한 비타민이에요. 당신을 만난 사람들은 큰 행운아예요! 🍌💛`,
      `${cleanNick}님, "일단 부딪혀보자!"며 뛰어드는 씩씩한 추진력과 밝은 용기가 상상 이상의 멋진 미래로 이끌어줄 거예요! 🚀`,
      `${cleanNick}님, 지치고 힘든 날에도 금세 툭툭 털고 일어나는 회복탄력성은 엄청난 재능이에요. 언제나 응원하는 사람들이 있어요! ☀️`,
      `${cleanNick}님, 어떤 먹구름도 당신이 가진 밝은 햇살 같은 온기를 가릴 수 없어요. 유쾌한 에너지로 세상을 밝혀주세요! ✨`,
    ],
    strawberry: [
      `${cleanNick}님, 친구들의 마음에 깊이 귀 기울이고 공감해주는 다정함은 이 세상에 가장 필요하고 소중한 치유의 빛이에요! 🍓💖`,
      `${cleanNick}님, 작은 친절 하나로도 누군가의 하루를 구원할 수 있는 사람, 그게 바로 당신이에요. 따뜻한 온기는 큰 축복이 될 거예요! 🌸`,
      `${cleanNick}님, 타인을 배려하느라 자신의 마음을 다치게 두지 마세요. 남을 보살피는 만큼 당신 스스로도 큰 사랑을 받을 자격이 있어요! 🌷`,
      `${cleanNick}님, 세상을 아름답게 바꾸는 힘은 사람을 아끼고 품어주는 따뜻한 마음에서 시작돼요. 선한 영향력을 믿어요! ☀️`,
    ],
    watermelon: [
      `${cleanNick}님, 모두가 망설일 때 앞장서서 방향을 잡아주는 듬직한 어깨와 시원한 결단력은 팀의 든든한 나침반이에요! 🍉👑`,
      `${cleanNick}님, 주변을 넓게 품어주는 큰 배포는 많은 사람들에게 믿음직한 안식처가 되어줘요. 큰 꿈을 향해 거침없이 나아가세요! 🌊`,
      `${cleanNick}님, 때로는 리더라는 무게감이 무거울 수 있지만, 깊은 책임감과 진심은 이미 모두에게 신뢰를 주고 있어요. 자신감을 가져요! 🛡️`,
      `${cleanNick}님, 시원시원하게 상황을 돌파해나가는 추진력이라면 앞으로 마주할 어떤 도전도 통쾌하게 이겨낼 수 있어요! 🚀`,
    ],
    lime: [
      `${cleanNick}님, 예상치 못한 위기 앞에서도 번뜩이는 재치와 센스로 유쾌하게 넘기는 순발력은 그 누구도 흉내 낼 수 없어요! 🍋⚡`,
      `${cleanNick}님, 벽에 부딪히더라도 "오히려 좋아!"라며 새로운 길을 찾아내는 유연함, 어떤 환경에서도 찬란하게 꽃피울 사람이에요! 🎯`,
      `${cleanNick}님, 상황을 무겁게 만들기보다 유쾌한 유머와 지혜로 전환하는 능력은 모두를 웃게 만드는 가장 상큼한 마법이에요! 💡`,
      `${cleanNick}님, 정답이 하나뿐인 시험지 너머에는 수천 가지의 해답이 있어요. 기발한 센스로 당신만의 신선한 길을 열어가세요! 🌿`,
    ],
    carrot: [
      `${cleanNick}님, 묵묵히 흘린 땀방울과 노력은 절대 배신하지 않아요. 땅속에서 단단하게 자란 뿌리가 가장 깊고 큰 숲을 만들어요! 🥕💎`,
      `${cleanNick}님, 흔들리지 않고 자신의 자리를 지켜내는 성실함이야말로 세상에서 가장 위대하고 값진 최고의 재능이에요! 🛡️`,
      `${cleanNick}님, 남들과의 속도 비교에 불안해하지 마세요. 하루하루 다져진 내공은 어떤 화려함보다 오래가는 실력이 돼요! 🏆`,
      `${cleanNick}님, 정직하게 최선을 다하는 진심은 언제나 감동을 줘요. 묵묵히 쌓아 올린 시간들은 반드시 눈부신 결실로 보답받을 거예요! 🌱✨`,
    ],
    avocado: [
      `${cleanNick}님, 주변이 아무리 소란스러워도 흔들리지 않는 차분한 평정심과 온화한 중재력은 친구들에게 가장 큰 안식처예요! 🥑🌿`,
      `${cleanNick}님, 부드러움 속에 숨겨진 단단한 씨앗처럼, 내면에는 그 누구보다 깊고 단단한 회복의 힘이 자리 잡고 있어요! 🪴`,
      `${cleanNick}님, 갈등 속에서도 화합을 이끌어내고 사람들을 편안하게 해주는 배려는 세상을 따뜻하게 치유하는 귀한 선물이에요! 🕊️`,
      `${cleanNick}님, 서두르지 않고 온전히 나답게 피어나는 평온한 숲속에서, 앞으로 더 많은 행복과 멋진 꿈들이 무럭무럭 자라날 거예요! 💚`,
    ],
  };

  const quotesForType = mentorQuotesPool[type] || [
    `${cleanNick}님은 무한한 가능성을 지닌 특별한 주인공이에요! 스스로를 믿고 한 걸음씩 나아가세요! ✨`,
    `${cleanNick}님의 작은 발걸음이 모여 세상에서 가장 멋진 길이 될 거예요! 항상 응원할게요! 🌟`,
    `${cleanNick}님이 가진 고유한 매력과 잠재력은 그 무엇과도 바꿀 수 없는 소중한 보물이에요! 💎`,
  ];

  // Pick a random quote from the pool
  const defaultDescription = quotesForType[Math.floor(Math.random() * quotesForType.length)];

  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.json({ description: defaultDescription, source: "template" });
    }

    const typeDetails: Record<string, string> = {
      apple: "창의적이고 독창적인 영감으로 일상을 디자인하는 '싱그러운 사과형'",
      dragonfruit: "과감한 도전과 파격적인 개성을 지닌 트렌드세터 '화려한 용과형'",
      blueberry: "예리한 논리와 지적 호기심으로 본질을 탐구하는 '명석한 블루베리형'",
      grapefruit: "솔직당당한 매력과 감각적인 직관을 갖춘 '당찬 자몽형'",
      banana: "유쾌한 비타민 에너지와 친화력 넘치는 행동파 '발랄 바나나형'",
      strawberry: "따뜻한 배려와 섬세한 공감력으로 마음을 힐링해주는 '달콤 딸기형'",
      watermelon: "시원시원한 결단력과 넓은 포용력으로 이끄는 '듬직한 수박형'",
      lime: "번뜩이는 재치와 순발력으로 문제를 해결하는 '톡톡 라임형'",
      carrot: "끈기 있는 노력과 높은 책임감으로 신뢰받는 '성실 당근형'",
      avocado: "부드러운 평정심과 온화한 밸런스로 안정을 주는 '포근 아보카도형'",
    };

    const targetTrait = typeDetails[type] || "매력 넘치는 탐험가";

    const prompt = `당신은 2026 수원청소년진로박람회 <AI와 함께 미래를 JOB다!> 미니유공방 부스의 청소년 진로 안내 멘토 AI입니다.
참가자 청소년: "${cleanNick}"
성향 진단 결과: "${targetTrait}"

규칙:
1. 청소년 참가자에게 큰 힘과 용기, 자존감을 불어넣어주는 따뜻하고 진심 어린 멘토의 응원 한마디(45~75자)를 작성하세요.
2. 진로에 대한 불안을 해소하고, 이 참가자가 가진 고유한 강점과 잠재력을 믿게 해주는 희망찬 메시지여야 합니다.
3. "${cleanNick}님, ~" 또는 "${cleanNick}아/야, ~" 로 자연스럽게 시작하세요.
4. 이모지 1~2개 포함.
5. 오직 완성된 한 문장만 출력하세요 (따옴표, 머리말, 인사말, 추가 해설 절대 금지).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
    });

    const generatedText = response.text?.trim();
    if (generatedText && generatedText.length >= 10 && generatedText.length <= 120) {
      return res.json({ description: generatedText, source: "gemini" });
    }

    return res.json({ description: defaultDescription, source: "fallback" });
  } catch (err) {
    console.error("Gemini generation failed, using fallback:", err);
    return res.json({ description: defaultDescription, source: "fallback" });
  }
});

// Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Eunpyeong Expo server listening on port ${PORT}`);
  });
}

startServer();
