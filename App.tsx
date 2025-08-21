import { useState, useEffect } from 'react';
import './App.css';

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

  // 顯示五十音表（只顯示目前階段的母音橫列，其餘為 '-'）
  const renderTable = (kana: string[][], type: 'kana' | 'romaji') => {
    // 目前階段的母音橫列 index
    const rowIdx = stage - 1;
    return (
      <table className="kana-table">
        <tbody>
          {kana.map((row, i) => (
            <tr key={i}>
              {row.map((k, j) => {
                let cell = '-';
                if (i === rowIdx && k) {
                  if (type === 'kana') cell = k;
                  else cell = ROMAJI[i][j] || '-';
                }
                return <td key={j}>{cell}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
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
    <div>
      <h1>日文五十音學習</h1>
      <div style={{ marginBottom: 16 }}>
        <button onClick={() => setMode('table')}>五十音表</button>
        <button onClick={() => setMode('quiz')}>隨機測驗</button>
        <button onClick={() => setMode('result')}>成績記錄</button>
      </div>
      {mode === 'table' && (
        <div>
          <div style={{ marginBottom: 8 }}>
            <button onClick={() => setKanaType('hiragana')}>平假名</button>
            <button onClick={() => setKanaType('katakana')}>片假名</button>
          </div>
          {kanaType === 'hiragana' && (
            <div className="kana-table-row">
              <div>
                <div style={{ marginBottom: 4, fontWeight: 'bold' }}>平假名</div>
                {renderTable(HIRAGANA, 'kana')}
              </div>
              <div>
                <div style={{ marginBottom: 4, fontWeight: 'bold' }}>羅馬拼音</div>
                {renderTable(ROMAJI, 'romaji')}
              </div>
            </div>
          )}
          {kanaType === 'katakana' && (
            <div className="kana-table-row">
              <div>
                <div style={{ marginBottom: 4, fontWeight: 'bold' }}>片假名</div>
                {renderTable(KATAKANA, 'kana')}
              </div>
              <div>
                <div style={{ marginBottom: 4, fontWeight: 'bold' }}>羅馬拼音</div>
                {renderTable(ROMAJI, 'romaji')}
              </div>
            </div>
          )}
        </div>
      )}
      {mode === 'quiz' && (
        <div>
          <div style={{ marginBottom: 8 }}>
            <button onClick={() => setKanaType('hiragana')}>平假名</button>
            <button onClick={() => setKanaType('katakana')}>片假名</button>
          </div>
          <div style={{ marginBottom: 8, color: '#ffb700' }}>
            <b>目前階段：</b> {stage} / {STAGES}（已解鎖 {unlockedCount} 個音）<br />
            <span>
              {stagePerfectCount[stage-1] ? `本階段已全對 ${stagePerfectCount[stage-1]} 次` : ''}
              {stagePerfectCount[stage-1] === 10 && stage < STAGES ? ' 🎉 恭喜！已解鎖下一階段！' : ''}
            </span>
          </div>
          <div className="quiz-area">
            <div style={{ fontSize: 48, margin: 16 }}>{quizKana}</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1em', flexWrap: 'wrap', marginBottom: 16 }}>
              {options.map(opt => (
                <button key={opt} style={{ minWidth: 80, fontSize: 20 }} onClick={() => handleChoice(opt)} disabled={score.length >= MAX_QUIZ_QUESTIONS}>{opt}</button>
              ))}
            </div>
            <div style={{ margin: 8 }}>
              <span>答對：{score.filter(s => s === 1).length} / {MAX_QUIZ_QUESTIONS}</span>
              <button style={{ marginLeft: 8 }} onClick={() => finishQuiz()} disabled={score.length < MAX_QUIZ_QUESTIONS}>結算成績</button>
            </div>
            {score.length >= MAX_QUIZ_QUESTIONS && <div style={{ color: '#f00', marginTop: 8 }}>已完成 10 題，請點「結算成績」</div>}
          </div>
        </div>
      )}
      {mode === 'result' && (
        <div>
          <h2>歷史成績</h2>
          <ul>
            {history.map((s, i) => (
              <li key={i}>第 {i + 1} 次：階段 {s.stage}，{s.correct} / {s.total} 全對</li>
            ))}
          </ul>
          <button onClick={restart}>再測一次</button>
        </div>
      )}
    </div>
  );
}

export default App;