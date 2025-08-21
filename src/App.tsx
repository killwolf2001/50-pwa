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
  const [kanaType, setKanaType] = useState<KanaType>('hiragana');
  const [stage, setStage] = useState(1); // 當前階段
  const [quizIdx, setQuizIdx] = useState(getRandomKanaIdx(STAGE_SIZE - 1));
  // 選擇題選項
  const [options, setOptions] = useState<string[]>([]);
  // const [answer, setAnswer] = useState(''); // 已不使用
  const [score, setScore] = useState<number[]>([]); // 本次測驗分數
  const MAX_QUIZ_QUESTIONS = 10;
  const [history, setHistory] = useState<{stage: number, correct: number, total: number}[]>([]); // 歷史成績
  const [stagePerfectCount, setStagePerfectCount] = useState<number[]>([]); // 每階段10次全對次數
  // 新增：手機版假名點擊時顯示羅馬拼音
  const [mobileRomaji, setMobileRomaji] = useState<string>('');

  // 載入進度
  useEffect(() => {
    const saved = localStorage.getItem('kana_scores');
    if (saved) setHistory(JSON.parse(saved));
    const savedStage = localStorage.getItem('kana_stage');
    if (savedStage) setStage(Number(savedStage));
    const savedPerfect = localStorage.getItem('kana_perfect');
    if (savedPerfect) setStagePerfectCount(JSON.parse(savedPerfect));
  }, []);

  // 儲存進度
  useEffect(() => {
    localStorage.setItem('kana_scores', JSON.stringify(history));
    localStorage.setItem('kana_stage', String(stage));
    localStorage.setItem('kana_perfect', JSON.stringify(stagePerfectCount));
  }, [history, stage, stagePerfectCount]);

  // 點擊假名時發音
  function speakKana(kana: string, romaji?: string) {
    if (!kana) return;
    const utter = new window.SpeechSynthesisUtterance(kana);
    utter.lang = 'ja-JP';
    window.speechSynthesis.speak(utter);
    // 僅在手機/窄螢幕時顯示羅馬拼音
    if (window.innerWidth <= 900 && romaji) {
      setMobileRomaji(romaji);
      setTimeout(() => setMobileRomaji(''), 1800);
    }
  }

  // 顯示五十音表（只顯示目前階段的母音橫列，其餘為 '-'）
  const renderTable = (kana: string[][], type: 'kana' | 'romaji') => {
    // 目前階段的母音橫列 index
    const rowIdx = stage - 1;
    return (
      <div className="table-responsive">
        <table className="table table-bordered text-center align-middle w-100" style={{fontSize: 'clamp(1.2rem, 4vw, 2.2rem)'}}>
          <tbody>
            {kana.map((row, i) => (
              <tr key={i}>
                {row.map((k, j) => {
                  let cell = '-';
                  let isActive = false;
                  if (i === rowIdx && k) {
                    isActive = true;
                    if (type === 'kana') cell = k;
                    else cell = ROMAJI[i][j] || '-';
                  }
                  return (
                    <td
                      key={j}
                      style={isActive && type === 'kana' ? { cursor: 'pointer', color: '#1976d2', fontWeight: 600 } : {}}
                      onClick={isActive && type === 'kana' ? () => speakKana(k, ROMAJI[i][j]) : undefined}
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
        setTimeout(() => finishQuiz(next), 200); // 稍微延遲，讓最後一題有反饋
      } else {
        setQuizIdx(getRandomKanaIdx(unlockedCount - 1));
      }
      return next;
    });
  }

  // 結束測驗
  function finishQuiz(finalScore?: number[]) {
    const quizScore = finalScore || score;
    const correct = quizScore.filter(s => s === 1).length;
    const total = quizScore.length;
    setHistory((h) => [...h, { stage, correct, total }]);
    // 若全對，記錄本階段全對次數
    if (correct === MAX_QUIZ_QUESTIONS) {
      setStagePerfectCount((arr) => {
        const next = [...arr];
        next[stage - 1] = (next[stage - 1] || 0) + 1;
        // 若本階段已10次全對且還有下一階段，解鎖下一階段
        if (next[stage - 1] === 10 && stage < STAGES) {
          setStage(stage + 1);
        }
        return next;
      });
    }
    setMode('result');
  }

  // 重新開始
  function restart() {
    setScore([]);
    setMode('quiz');
    setQuizIdx(getRandomKanaIdx(unlockedCount - 1));
  }

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
            <button className={`btn btn-outline-secondary mx-1 ${kanaType==='hiragana'?'active':''}`} onClick={() => setKanaType('hiragana')}>平假名</button>
            <button className={`btn btn-outline-secondary mx-1 ${kanaType==='katakana'?'active':''}`} onClick={() => setKanaType('katakana')}>片假名</button>
          </div>
          <div className="mb-2 text-warning fw-bold">
            <span>目前階段：</span> {stage} / {STAGES}（已解鎖 {unlockedCount} 個音）<br />
            <span>
              {stagePerfectCount[stage-1] ? `本階段已全對 ${stagePerfectCount[stage-1]} 次` : ''}
              {stagePerfectCount[stage-1] === 10 && stage < STAGES ? ' 🎉 恭喜！已解鎖下一階段！' : ''}
            </span>
          </div>
          <div className="quiz-area mx-auto p-3 rounded bg-light shadow-sm" style={{maxWidth:400}}>
            <div className="display-4 my-3">{quizKana}</div>
            <div className="d-flex flex-wrap justify-content-center gap-2 mb-3">
              {options.map(opt => (
                <button key={opt} className="btn btn-outline-primary" style={{minWidth:80,fontSize:20}} onClick={() => handleChoice(opt)} disabled={score.length >= MAX_QUIZ_QUESTIONS}>{opt}</button>
              ))}
            </div>
            <div className="mb-2">
              <span>答對：{score.filter(s => s === 1).length} / {MAX_QUIZ_QUESTIONS}</span>
              <button className="btn btn-success ms-2" onClick={() => finishQuiz()} disabled={score.length < MAX_QUIZ_QUESTIONS}>結算成績</button>
            </div>
            {score.length >= MAX_QUIZ_QUESTIONS && <div className="text-danger mt-2">已完成 10 題，請點「結算成績」</div>}
          </div>
        </div>
      )}
      {mode === 'result' && (
        <div className="text-center">
          <h2 className="text-warning mt-4 mb-3">歷史成績</h2>
          <ul className="list-unstyled text-light">
            {history.map((s, i) => (
              <li key={i} className="mb-1">第 {i + 1} 次：階段 {s.stage}，{s.correct} / {s.total} 全對</li>
            ))}
          </ul>
          <button className="btn btn-primary" onClick={restart}>再測一次</button>
        </div>
      )}
    </div>
  );
}

export default App;
