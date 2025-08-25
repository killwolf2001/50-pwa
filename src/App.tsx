import { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

// 五十音資料與階段分組
const HIRAGANA = [
  ['あ', 'い', 'う', 'え', 'お'],
  ['か', 'き', 'く', 'け', 'こ'],
  ['さ', 'し', 'す', 'せ', 'そ'],
  ['た', 'ち', 'つ', 'て', 'と'],
  ['な', 'に', 'ぬ', 'ね', 'の'],
  ['は', 'ひ', 'ふ', 'へ', 'ほ'],
  ['ま', 'み', 'む', 'め', 'も'],
  ['や', '', 'ゆ', '', 'よ'],
  ['ら', 'り', 'る', 'れ', 'ろ'],
  ['わ', '', '', '', 'を'],
  ['ん', '', '', '', ''],
];
const KATAKANA = [
  ['ア', 'イ', 'ウ', 'エ', 'オ'],
  ['カ', 'キ', 'ク', 'ケ', 'コ'],
  ['サ', 'シ', 'ス', 'セ', 'ソ'],
  ['タ', 'チ', 'ツ', 'テ', 'ト'],
  ['ナ', 'ニ', 'ヌ', 'ネ', 'ノ'],
  ['ハ', 'ヒ', 'フ', 'ヘ', 'ホ'],
  ['マ', 'ミ', 'ム', 'メ', 'モ'],
  ['ヤ', '', 'ユ', '', 'ヨ'],
  ['ラ', 'リ', 'ル', 'レ', 'ロ'],
  ['ワ', '', '', '', 'ヲ'],
  ['ン', '', '', '', ''],
];
const ROMAJI = [
  ['a', 'i', 'u', 'e', 'o'],
  ['ka', 'ki', 'ku', 'ke', 'ko'],
  ['sa', 'shi', 'su', 'se', 'so'],
  ['ta', 'chi', 'tsu', 'te', 'to'],
  ['na', 'ni', 'nu', 'ne', 'no'],
  ['ha', 'hi', 'fu', 'he', 'ho'],
  ['ma', 'mi', 'mu', 'me', 'mo'],
  ['ya', '', 'yu', '', 'yo'],
  ['ra', 'ri', 'ru', 're', 'ro'],
  ['wa', '', '', '', 'wo'],
  ['n', '', '', '', ''],
];
const FLAT_HIRAGANA = HIRAGANA.flat().map((k, i) => ({ k, i })).filter(x => x.k);
const FLAT_KATAKANA = KATAKANA.flat().map((k, i) => ({ k, i })).filter(x => x.k);
const FLAT_ROMAJI = ROMAJI.flat().map((k, i) => ({ k, i })).filter(x => x.k);
const STAGE_SIZE = 5;
const STAGES = Math.ceil(FLAT_HIRAGANA.length / STAGE_SIZE);
type KanaType = 'hiragana' | 'katakana';
function getRandomKanaIdx(maxIdx: number) {
  return Math.floor(Math.random() * (maxIdx + 1));
}

function App() {
  const [mode, setMode] = useState<'table' | 'quiz' | 'result'>('table');
  const [quizStarted, setQuizStarted] = useState(false);
  const [kanaType, setKanaType] = useState<KanaType>('hiragana');
  // 依 kanaType 分開記錄進度、歷史、全對次數
// 依 kanaType 分開記錄進度、歷史、全對次數
const STORAGE = {
  hiragana: {
    stage: 'kana_stage_hira',
    history: 'kana_scores_hira',
    perfect: 'kana_perfect_hira',
  },
  katakana: {
    stage: 'kana_stage_kata',
    history: 'kana_scores_kata',
    perfect: 'kana_perfect_kata',
  }
};

  const [stage, setStage] = useState(1); // 當前階段
  const [quizIdx, setQuizIdx] = useState(getRandomKanaIdx(STAGE_SIZE - 1));
  const [options, setOptions] = useState<string[]>([]);
  const [score, setScore] = useState<number[]>([]); // 本次測驗分數
  const MAX_QUIZ_QUESTIONS = 10;
  const [history, setHistory] = useState<{stage: number, correct: number, total: number}[]>([]); // 歷史成績
  const [stagePerfectCount, setStagePerfectCount] = useState<number[]>([]); // 每階段10次全對次數
  const [mobileRomaji, setMobileRomaji] = useState<string>('');

  // 載入對應 kanaType 的進度
  useEffect(() => {
    const key = STORAGE[kanaType];
    const saved = localStorage.getItem(key.history);
    setHistory(saved ? JSON.parse(saved) : []);
    const savedStage = localStorage.getItem(key.stage);
    setStage(savedStage ? Number(savedStage) : 1);
    const savedPerfect = localStorage.getItem(key.perfect);
    setStagePerfectCount(savedPerfect ? JSON.parse(savedPerfect) : []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kanaType]);

  // 儲存對應 kanaType 的進度
  useEffect(() => {
    const key = STORAGE[kanaType];
    localStorage.setItem(key.history, JSON.stringify(history));
    localStorage.setItem(key.stage, String(stage));
    localStorage.setItem(key.perfect, JSON.stringify(stagePerfectCount));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history, stage, stagePerfectCount, kanaType]);

  // 點擊假名時發音
  function speakKana(kana: string) {
    if (!kana) return;
    const utter = new window.SpeechSynthesisUtterance(kana);
    utter.lang = 'ja-JP';
    window.speechSynthesis.speak(utter);
    // 查找對應羅馬拼音
    let romaji = '';
    if (kanaType === 'hiragana') {
      const idx = FLAT_HIRAGANA.findIndex(x => x.k === kana);
      if (idx >= 0) romaji = FLAT_ROMAJI[idx]?.k || '';
    } else {
      const idx = FLAT_KATAKANA.findIndex(x => x.k === kana);
      if (idx >= 0) romaji = FLAT_ROMAJI[idx]?.k || '';
    }
    if (window.innerWidth <= 900 && romaji) {
      setMobileRomaji(romaji);
      setTimeout(() => setMobileRomaji(''), 1800);
    }
  }

  // 顯示五十音表（只顯示目前階段的母音橫列，其餘為 '-'）
  // 顯示所有已通過的音，未通過的顯示為 '-'
  const renderTable = (kana: string[][], type: 'kana' | 'romaji') => {
    // 已通過的音數
    const unlocked = Math.min(stage * STAGE_SIZE, (kanaType === 'hiragana' ? FLAT_HIRAGANA : FLAT_KATAKANA).length);
    let flat = [];
    if (type === 'kana') {
      flat = (kanaType === 'hiragana' ? FLAT_HIRAGANA : FLAT_KATAKANA).map(x => x.k);
    } else {
      flat = FLAT_ROMAJI.map(x => x.k);
    }
    let idx = 0;
    return (
      <div className="table-responsive">
        <table className="table table-bordered text-center align-middle w-100" style={{fontSize: 'clamp(1.2rem, 4vw, 2.2rem)'}}>
          <tbody>
            {kana.map((row, i) => (
              <tr key={i}>
                {row.map((k, j) => {
                  let cell = '-';
                  let isActive = false;
                  if (k && idx < flat.length) {
                    if (idx < unlocked) {
                      cell = flat[idx];
                      isActive = type === 'kana';
                    }
                    idx++;
                  } else if (k) {
                    idx++;
                  }
                  return (
                    <td
                      key={j}
                      style={isActive ? { cursor: 'pointer', color: '#1976d2', fontWeight: 600 } : {}}
                      onClick={isActive && type === 'kana' ? () => speakKana(cell) : undefined}
                      title={isActive && type === 'kana' ? '點擊發音' : ''}
                    >
                      {cell}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // 取得目前可用的音
  const flatKana = kanaType === 'hiragana' ? FLAT_HIRAGANA : FLAT_KATAKANA;
  const flatRomaji = FLAT_ROMAJI;
  const unlockedCount = Math.min(stage * STAGE_SIZE, flatKana.length);
  const quizKana = flatKana[quizIdx].k;
  const quizRomaji = flatRomaji[quizIdx].k;

  // 產生選擇題選項
  useEffect(() => {
    // 取得所有已解鎖的羅馬拼音
    const pool = flatRomaji.slice(0, unlockedCount).map(x => x.k).filter(Boolean);
    // 正確答案
    const correct = quizRomaji;
    // 取出3個不重複的錯誤選項
  const wrongs = pool.filter(r => r !== correct);
    // 隨機洗牌
    for (let i = wrongs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [wrongs[i], wrongs[j]] = [wrongs[j], wrongs[i]];
    }
    const picked = wrongs.slice(0, 3);
    // 合併正確答案並再洗牌
    const opts = [...picked, correct].sort(() => Math.random() - 0.5);
    setOptions(opts);
  }, [quizIdx, unlockedCount, kanaType, flatRomaji, quizRomaji]);

  // 選擇題作答
  function handleChoice(choice: string) {
    setScore((s) => {
      const next = [...s, choice === quizRomaji ? 1 : 0];
      if (next.length >= MAX_QUIZ_QUESTIONS) {
        setTimeout(() => {
          finishQuiz(next);
          setQuizStarted(false);
        }, 200); // 稍微延遲，讓最後一題有反饋
      } else {
        let newIdx = getRandomKanaIdx(unlockedCount - 1);
        // 避免與上一題重複
        let tryCount = 0;
        while (newIdx === quizIdx && unlockedCount > 1 && tryCount < 10) {
          newIdx = getRandomKanaIdx(unlockedCount - 1);
          tryCount++;
        }
        setQuizIdx(newIdx);
      }
      return next;
    });
  }

  // 結束測驗
  function finishQuiz(finalScore?: number[]) {
    const quizScore = finalScore || score;
    const correct = quizScore.filter(s => s === 1).length;
    const total = quizScore.length;
    // 只有完成10題才記錄成績
    if (total === MAX_QUIZ_QUESTIONS) {
      setHistory((h) => [...h, { stage, correct, total }]);
      // 若全對，記錄本階段全對次數
      if (correct === MAX_QUIZ_QUESTIONS) {
        setStagePerfectCount((arr) => {
          const next = [...arr];
          next[stage - 1] = (next[stage - 1] || 0) + 1;
          // 若本階段已10次全對且還有下一階段，解鎖下一階段
          if (next[stage - 1] === 10 && stage < STAGES) {
            setStage((prev) => {
              // 進入新階段時清空歷史成績
              setHistory([]);
              return prev + 1;
            });
          }
          return next;
        });
      }
    }
    setMode('result');
  }

  // 重新開始

  return (
    <div className="container py-3">
      <h1 className="text-center mb-4">日文五十音學習</h1>
      <div className="d-flex justify-content-center gap-2 mb-3 flex-wrap">
        <button className="btn btn-primary" onClick={() => setMode('table')}>五十音表</button>
        <button className="btn btn-success" onClick={() => setMode('quiz')}>隨機測驗</button>
        <button className="btn btn-warning" onClick={() => setMode('result')}>成績記錄</button>
      </div>
      {mode === 'table' && (
        <div className="text-center">
          <div className="mb-2">
            <button className={`btn btn-outline-secondary mx-1 ${kanaType==='hiragana'?'active':''}`} onClick={() => setKanaType('hiragana')}>平假名</button>
            <button className={`btn btn-outline-secondary mx-1 ${kanaType==='katakana'?'active':''}`} onClick={() => setKanaType('katakana')}>片假名</button>
          </div>
          {kanaType === 'hiragana' && (
            <div className="row justify-content-center">
              <div className="col-12 col-md-6 col-lg-5 mb-3">
                <div className="fw-bold mb-1">平假名</div>
                {renderTable(HIRAGANA, 'kana')}
              </div>
              <div className="col-12 col-md-6 col-lg-5 mb-3 d-none d-md-block romaji-table-desktop">
                <div className="fw-bold mb-1">羅馬拼音</div>
                {renderTable(ROMAJI, 'romaji')}
              </div>
            </div>
          )}
          {kanaType === 'katakana' && (
            <div className="row justify-content-center">
              <div className="col-12 col-md-6 col-lg-5 mb-3">
                <div className="fw-bold mb-1">片假名</div>
                {renderTable(KATAKANA, 'kana')}
              </div>
              <div className="col-12 col-md-6 col-lg-5 mb-3 d-none d-md-block romaji-table-desktop">
                <div className="fw-bold mb-1">羅馬拼音</div>
                {renderTable(ROMAJI, 'romaji')}
              </div>
            </div>
          )}
          {/* 手機顯示羅馬拼音浮現區 */}
          {mobileRomaji && (
            <div className="mobile-romaji-popup position-fixed start-50 translate-middle-x" style={{bottom:'18vh',zIndex:100,background:'rgba(30,34,44,0.98)',color:'#ffd600',fontSize:'2.2em',fontWeight:'bold',textAlign:'center',borderRadius:'16px',boxShadow:'0 4px 24px #0008',padding:'18px 0 14px 0',width:'80vw',maxWidth:'340px',pointerEvents:'none',letterSpacing:'0.08em'}}>{mobileRomaji}</div>
          )}
        </div>
      )}
      {mode === 'quiz' && (
        <div className="text-center">
          <div className="mb-2">
            <button className={`btn btn-outline-secondary mx-1 ${kanaType==='hiragana'?'active':''}`} onClick={() => { setKanaType('hiragana'); setQuizStarted(false); setScore([]); }}>
              平假名
            </button>
            <button className={`btn btn-outline-secondary mx-1 ${kanaType==='katakana'?'active':''}`} onClick={() => { setKanaType('katakana'); setQuizStarted(false); setScore([]); }}>
              片假名
            </button>
          </div>
          <div className="mb-2 text-warning fw-bold">
            <span>目前階段：</span> {stage} / {STAGES}（已解鎖 {unlockedCount} 個音）<br />
            <span>
              {stagePerfectCount[stage-1] ? `本階段已全對 ${stagePerfectCount[stage-1]} 次` : ''}
              {stagePerfectCount[stage-1] === 10 && stage < STAGES ? ' 🎉 恭喜！已解鎖下一階段！' : ''}
            </span>
          </div>
          {!quizStarted ? (
            <button className="btn btn-lg btn-success my-4" onClick={() => { setQuizStarted(true); setScore([]); setQuizIdx(getRandomKanaIdx(unlockedCount - 1)); }}>
              開始測驗
            </button>
          ) : (
            <div className="quiz-area mx-auto p-3 rounded bg-light shadow-sm" style={{maxWidth:400}}>
              <div className="display-4 my-3">{quizKana}</div>
              <div className="d-flex flex-wrap justify-content-center gap-2 mb-3">
                {options.map(opt => (
                  <button key={opt} className="btn btn-outline-primary" style={{minWidth:80,fontSize:20}} onClick={() => handleChoice(opt)} disabled={score.length >= MAX_QUIZ_QUESTIONS}>{opt}</button>
                ))}
              </div>
              <div className="mb-2">
                <span>答對：{score.filter(s => s === 1).length} / {MAX_QUIZ_QUESTIONS}</span>
              </div>
            </div>
          )}
        </div>
      )}
      {mode === 'result' && (
        <div className="text-center">
          <h2 className="text-warning mt-4 mb-3">歷史成績</h2>
          <ul className="list-unstyled" style={{color:'#222', background:'#fff', borderRadius:8, maxWidth:400, margin:'0 auto', padding:'1em 0.5em'}}>
            {history.map((s, i) => (
              <li key={i} className="mb-1">第 {i + 1} 次：階段 {s.stage}，{s.correct} / {s.total}{s.correct === s.total ? ' 全對' : ''}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
