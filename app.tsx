import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  Music, 
  Sparkles, 
  CheckCircle, 
  Clock, 
  Smile, 
  Heart, 
  Award, 
  Calendar, 
  AlertTriangle,
  User,
  Users,
  ChevronLeft,
  ChevronRight,
  Coffee,
  CheckSquare,
  TrendingUp,
  Flame,
  Plus,
  Trash2,
  Info,
  Star,
  Camera,
  ImageIcon,
  Columns,
  Send,
  Zap,
  ThumbsUp,
  X,
  Bell,
  RefreshCw,
  Wand2,
  Lightbulb,
  Loader2
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, onSnapshot } from 'firebase/firestore';

// --- CONFIGURATION & TIME CONSTANTS ---
const START_DATE = new Date('2026-06-15');
const END_DATE = new Date('2026-08-13');

const generateDateRange = (start, end) => {
  const dates = [];
  let curr = new Date(start);
  while (curr <= end) {
    dates.push(new Date(curr));
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
};

const ALL_DATES = generateDateRange(START_DATE, END_DATE);

const formatDateKey = (date) => {
  return date.toISOString().split('T')[0];
};

const getDayName = (date) => {
  return date.toLocaleDateString('en-US', { weekday: 'short' });
};

const getFormattedDateLabel = (date) => {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// --- SCHEDULES & CAMPS DATA ---
const FAMILY_VACATION = { start: new Date('2026-06-25'), end: new Date('2026-07-10') };
const TKD_CAMP = { start: new Date('2026-08-02'), end: new Date('2026-08-09') };

const isSportsCampDay = (date) => {
  const day = date.getDay(); 
  const time = date.getTime();
  const week1Start = new Date('2026-07-13').getTime();
  const week1End = new Date('2026-07-17').getTime();
  const week2Start = new Date('2026-07-20').getTime();
  const week2End = new Date('2026-07-24').getTime();
  
  const isWeek1 = time >= week1Start && time <= week1End + 86400000;
  const isWeek2 = time >= week2Start && time <= week2End + 86400000;
  
  return (isWeek1 || isWeek2) && (day >= 1 && day <= 5);
};

// Static default classes if no custom live ones exist yet
const ACADEMIC_CLASSES = {
  '2026-06-15': [
    { id: 'def-1', name: 'Science', time: '3:00–4:00 pm' },
    { id: 'def-2', name: 'Maths', time: '4:00–5:00 pm' }
  ],
  '2026-06-17': [
    { id: 'def-3', name: 'English', time: '3:00–4:00 pm' }
  ],
  '2026-06-22': [
    { id: 'def-4', name: 'Science', time: '3:00–4:00 pm' },
    { id: 'def-5', name: 'Maths', time: '4:00–5:00 pm' }
  ],
  '2026-06-24': [
    { id: 'def-6', name: 'English', time: '3:00–4:00 pm' },
    { id: 'def-7', name: 'Science', time: '4:00–5:00 pm' }
  ],
  '2026-07-13': [
    { id: 'def-8', name: 'Science', time: '3:00–4:00 pm' },
    { id: 'def-9', name: 'Maths', time: '4:00–5:00 pm' }
  ],
  '2026-07-15': [
    { id: 'def-10', name: 'Science', time: '11:00 am–12:00 nn', conflict: true },
    { id: 'def-11', name: 'English', time: '12:00–1:00 pm', conflict: true }
  ],
  '2026-07-20': [
    { id: 'def-12', name: 'Science', time: '3:00–4:00 pm' }
  ],
  '2026-07-22': [
    { id: 'def-13', name: 'Science', time: '11:00 am–12:00 nn', conflict: true },
    { id: 'def-14', name: 'English', time: '3:00–4:00 pm' }
  ],
  '2026-07-27': [
    { id: 'def-15', name: 'Science', time: '3:00–4:00 pm' },
    { id: 'def-16', name: 'Maths', time: '4:00–5:00 pm' }
  ],
  '2026-07-29': [
    { id: 'def-17', name: 'Science', time: '11:00 am–12:00 nn' },
    { id: 'def-18', name: 'English', time: '12:00–1:00 pm' }
  ],
  '2026-08-10': [
    { id: 'def-19', name: 'Science', time: '3:00–4:00 pm' },
    { id: 'def-20', name: 'Maths', time: '4:00–5:00 pm' }
  ],
  '2026-08-12': [
    { id: 'def-21', name: 'English', time: '3:00–4:00 pm' },
    { id: 'def-22', name: 'Science', time: '4:00–5:00 pm' }
  ]
};

const getDaySpecialEvent = (date) => {
  const time = date.getTime();
  if (time >= FAMILY_VACATION.start.getTime() && time <= FAMILY_VACATION.end.getTime() + 86400000) {
    return { type: 'vacation', name: 'Family Vacation 🏖️', color: 'bg-amber-100 text-amber-800 border-amber-200' };
  }
  if (time >= TKD_CAMP.start.getTime() && time <= TKD_CAMP.end.getTime() + 86400000) {
    return { type: 'tkd', name: '🥋 Taekwondo Camp', color: 'bg-red-100 text-red-800 border-red-200' };
  }
  if (isSportsCampDay(date)) {
    return { type: 'sports', name: '⚽ Sports Camp (10am–2pm)', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
  }
  return null;
};

// Base daily chores list
const DEFAULT_TASKS = [
  { id: 'piano', label: 'Piano Practice (30 min) 🎹', detail: 'Prioritize this over theory revisions.', category: 'music' },
  { id: 'theory', label: 'Theory Revision (30 min) 🎼', detail: 'Review your musical revision sheets.', category: 'music' },
  { id: 'pushups', label: '5 sets of 7 Pushups 💪', detail: 'Build strength over the day.', category: 'fitness' },
  { id: 'cardio', label: 'Cardio Outside / Run with Marcus 🏃‍♂️', detail: '1 hour of outdoor energetic cardio.', category: 'fitness' },
  { id: 'skincare', label: 'Acne Skincare routine 🧴', detail: 'Wash face and apply treatment twice daily.', category: 'health' },
  { id: 'water', label: 'Drink 2 full bottles of water 💧', detail: 'Stay hydrated through the heat.', category: 'habit' },
  { id: 'habits', label: 'Self-Improvement Habits ✨', detail: 'Flush toilet, cover contact case, clean up.', category: 'habit' },
  { id: 'initiative', label: 'Propose a Summer Project 💡', detail: 'Find a cool task/project & pitch to parents.', category: 'intellect' },
  { id: 'olympiad', label: 'Olympiad Math Challenge 🧠', detail: 'Challenge your brain with hard questions.', category: 'intellect' },
];

// --- SAFE FIREBASE INITIALIZER WITH DEFAULTS ---
const getFirebaseSetup = () => {
  let config = null;
  let customToken = '';
  let id = 'aiden-summer-2026';

  try {
    if (typeof __firebase_config !== 'undefined' && __firebase_config) {
      config = JSON.parse(__firebase_config);
    }
    if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
      customToken = __initial_auth_token;
    }
    if (typeof __app_id !== 'undefined' && __app_id) {
      id = __app_id;
    }
  } catch (e) {
    console.warn("Global configs not injected yet. Using fallback mode.", e);
  }

  // --- PLACEHOLDER CONFIGURATION FOR LOCAL/VERCEL RUNS ---
  // To use your own permanent Firebase, replace the keys below with yours:
  if (!config) {
    config = {
      apiKey: "",
      authDomain: "",
      projectId: "",
      storageBucket: "",
      messagingSenderId: "",
      appId: ""
    };
  }

  return { config, customToken, id };
};

const { config: fbConfig, customToken: initialToken, id: appId } = getFirebaseSetup();

// Initialize app only if a valid apiKey is configured
const isFirebaseReady = fbConfig && fbConfig.apiKey !== "";
let appInstance = null;
let auth = null;
let db = null;

if (isFirebaseReady) {
  try {
    appInstance = initializeApp(fbConfig);
    auth = getAuth(appInstance);
    db = getFirestore(appInstance);
  } catch (err) {
    console.error("Firebase setup failed:", err);
  }
}

// --- GEMINI API INTEGRATION ---
const apiKey = ""; // Runtime injected or replace with yours from Google AI Studio

const fetchWithRetry = async (url, options, retries = 5) => {
  const delays = [1000, 2000, 4000, 8000, 16000];
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(res => setTimeout(res, delays[i]));
    }
  }
};

const generateGeminiText = async (prompt) => {
  if (!apiKey) {
    throw new Error("Please insert your Gemini API Key in the codebase to run AI features!");
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    })
  };
  const data = await fetchWithRetry(url, options);
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
};

export default function App() {
  const [role, setRole] = useState('aiden'); 
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(isFirebaseReady);
  
  const [selectedDate, setSelectedDate] = useState(new Date('2026-06-15'));
  const [compareDateKey, setCompareDateKey] = useState('');
  const [parentReminderInput, setParentReminderInput] = useState('');
  const [discretionaryReasonInput, setDiscretionaryReasonInput] = useState('');
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

  // Editable Daily Schedule
  const [newEventName, setNewEventName] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [isAddingEvent, setIsAddingEvent] = useState(false);

  // Gemini API States
  const [isDraftingPraise, setIsDraftingPraise] = useState(false);
  const [praiseError, setPraiseError] = useState('');
  const [projectInterest, setProjectInterest] = useState('');
  const [projectIdea, setProjectIdea] = useState('');
  const [isGeneratingIdea, setIsGeneratingIdea] = useState(false);

  // Fallback states for non-Firebase environments
  const [daysState, setDaysState] = useState({});
  const [booksState, setBooksState] = useState({ count: 0, titles: ['', '', '', ''] });

  const timelineRef = useRef(null);

  // --- RULE 3: AUTH LOGS FOR LIVE DATABASE ---
  useEffect(() => {
    if (!isFirebaseReady || !auth) {
      setIsAuthLoading(false);
      return;
    }
    const initAuth = async () => {
      try {
        if (initialToken) {
          await signInWithCustomToken(auth, initialToken);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Firebase Auth initialization failed:", err);
      } finally {
        setIsAuthLoading(false);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // --- RULE 1: REAL-TIME COLLABORATIVE SYNC ---
  useEffect(() => {
    if (!isFirebaseReady || !user || !db) return;

    const daysCollectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'days');
    const unsubscribeDays = onSnapshot(
      daysCollectionRef,
      (snapshot) => {
        const loadedDays = {};
        snapshot.forEach((doc) => {
          loadedDays[doc.id] = doc.data();
        });
        setDaysState(loadedDays);
      },
      (error) => {
        console.error("Firestore loading error:", error);
      }
    );

    const booksDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'books', 'milestones');
    const unsubscribeBooks = onSnapshot(
      booksDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setBooksState(snapshot.data());
        }
      },
      (error) => {
        console.error("Firestore loading error for books:", error);
      }
    );

    return () => {
      unsubscribeDays();
      unsubscribeBooks();
    };
  }, [user]);

  const dateKey = formatDateKey(selectedDate);
  const currentDayData = daysState[dateKey] || {
    completed: {},
    mood: '',
    commentary: '',
    parentComment: '',
    appreciations: Array(10).fill(''),
    skincarePhoto: '',
    parentReminder: '',
    discretionaryPoints: 0,
    discretionaryReason: ''
  };

  const appreciationsList = currentDayData.appreciations || Array(10).fill('');

  // --- DATABASE HELPERS ---
  const saveDayState = async (key, updatedData) => {
    // If Firebase isn't set up, we keep updates in local memory
    if (!isFirebaseReady || !user || !db) {
      setDaysState(prev => ({ ...prev, [key]: updatedData }));
      return;
    }
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'days', key);
      await setDoc(docRef, updatedData, { merge: true });
    } catch (err) {
      console.error("Failed saving day configuration to database:", err);
    }
  };

  const saveBooksState = async (updatedBooks) => {
    if (!isFirebaseReady || !user || !db) {
      setBooksState(updatedBooks);
      return;
    }
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'books', 'milestones');
      await setDoc(docRef, updatedBooks);
    } catch (err) {
      console.error("Failed saving books status to database:", err);
    }
  };

  const getDayEvents = (dayKey) => {
    const stored = daysState[dayKey]?.schedule;
    if (stored !== undefined) return stored;
    const defaultEvents = ACADEMIC_CLASSES[dayKey] || [];
    return defaultEvents;
  };

  const handleAddScheduleEvent = () => {
    if (!newEventName.trim() || !newEventTime.trim()) return;
    const newEvent = { 
      id: Date.now().toString() + Math.random().toString(36).substring(2), 
      name: newEventName, 
      time: newEventTime 
    };
    const currentSchedule = getDayEvents(dateKey);
    const updated = {
      ...currentDayData,
      schedule: [...currentSchedule, newEvent]
    };
    setDaysState(prev => ({ ...prev, [dateKey]: updated }));
    saveDayState(dateKey, updated);
    setNewEventName('');
    setNewEventTime('');
    setIsAddingEvent(false);
  };

  const handleDeleteScheduleEvent = (idToRemove) => {
    const currentSchedule = getDayEvents(dateKey);
    const updated = {
      ...currentDayData,
      schedule: currentSchedule.filter(e => e.id !== idToRemove)
    };
    setDaysState(prev => ({ ...prev, [dateKey]: updated }));
    saveDayState(dateKey, updated);
  };

  // POINT CALCULATOR FUNCTION
  const calculatePointsForDay = (dayKey) => {
    const dayData = daysState[dayKey];
    if (!dayData) return { base: 0, bonus: 0, discretionary: 0, total: 0 };

    const completedTasksCount = Object.values(dayData.completed || {}).filter(Boolean).length;
    const totalTasks = DEFAULT_TASKS.length; 
    const completionPercentage = completedTasksCount / totalTasks;

    let basePoints = 0;
    if (completionPercentage >= 0.5) {
      if (completedTasksCount === 5) basePoints = 2;
      else if (completedTasksCount === 6) basePoints = 4;
      else if (completedTasksCount === 7) basePoints = 6;
      else if (completedTasksCount === 8) basePoints = 8;
      else if (completedTasksCount === 9) basePoints = 10;
    }

    let bonusPoints = 0;
    const filledAppreciations = (dayData.appreciations || []).filter(item => item.trim() !== '').length;
    if (filledAppreciations === 10) {
      bonusPoints += 3;
    }

    if (dayData.skincarePhoto && dayData.skincarePhoto.trim() !== '') {
      bonusPoints += 1;
    }

    const discretionary = dayData.discretionaryPoints || 0;

    return {
      base: basePoints,
      bonus: bonusPoints,
      discretionary,
      total: basePoints + bonusPoints + discretionary
    };
  };

  const calculateTotalPoints = () => {
    return Object.keys(daysState).reduce((acc, key) => {
      const dayPoints = calculatePointsForDay(key);
      return acc + dayPoints.total;
    }, 0);
  };

  const cumulativePoints = calculateTotalPoints();

  const getLevelInfo = (points) => {
    if (points >= 300) return { title: '👑 Summer Champion', color: 'text-purple-600', bg: 'bg-purple-100', nextAt: 'MAX' };
    if (points >= 150) return { title: '🌟 Elite Trailblazer', color: 'text-blue-600', bg: 'bg-blue-100', nextAt: 300 };
    if (points >= 75) return { title: '🔥 Daily Ranger', color: 'text-rose-600', bg: 'bg-rose-100', nextAt: 150 };
    if (points >= 30) return { title: '⚡ Keen Learner', color: 'text-amber-600', bg: 'bg-amber-100', nextAt: 75 };
    return { title: '🌱 Fresh Adventurer', color: 'text-emerald-600', bg: 'bg-emerald-100', nextAt: 30 };
  };

  const levelInfo = getLevelInfo(cumulativePoints);

  const handleTaskToggle = (taskId) => {
    const completed = { ...currentDayData.completed };
    completed[taskId] = !completed[taskId];
    
    const updated = {
      ...currentDayData,
      completed
    };
    
    setDaysState(prev => ({ ...prev, [dateKey]: updated }));
    saveDayState(dateKey, updated);
  };

  const handleMoodSelect = (mood) => {
    const updated = { ...currentDayData, mood };
    setDaysState(prev => ({ ...prev, [dateKey]: updated }));
    saveDayState(dateKey, updated);
  };

  const handleCommentaryChange = (text) => {
    const updated = { ...currentDayData, commentary: text };
    setDaysState(prev => ({ ...prev, [dateKey]: updated }));
    saveDayState(dateKey, updated);
  };

  const handleAppreciationChange = (index, value) => {
    const updatedAppreciations = [...appreciationsList];
    updatedAppreciations[index] = value;
    
    const updated = {
      ...currentDayData,
      appreciations: updatedAppreciations
    };
    setDaysState(prev => ({ ...prev, [dateKey]: updated }));
    saveDayState(dateKey, updated);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 250;
        const MAX_HEIGHT = 250;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);

        const updated = {
          ...currentDayData,
          skincarePhoto: compressedBase64
        };
        setDaysState(prev => ({ ...prev, [dateKey]: updated }));
        saveDayState(dateKey, updated);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleDeletePhoto = () => {
    const updated = { ...currentDayData, skincarePhoto: '' };
    setDaysState(prev => ({ ...prev, [dateKey]: updated }));
    saveDayState(dateKey, updated);
  };

  const handleParentCommentChange = (text) => {
    const updated = { ...currentDayData, parentComment: text };
    setDaysState(prev => ({ ...prev, [dateKey]: updated }));
    saveDayState(dateKey, updated);
  };

  const handleSendReminder = () => {
    if (!parentReminderInput.trim()) return;
    const updated = {
      ...currentDayData,
      parentReminder: parentReminderInput
    };
    setDaysState(prev => ({ ...prev, [dateKey]: updated }));
    saveDayState(dateKey, updated);
    setParentReminderInput('');
  };

  const handleClearReminder = () => {
    const updated = { ...currentDayData, parentReminder: '' };
    setDaysState(prev => ({ ...prev, [dateKey]: updated }));
    saveDayState(dateKey, updated);
  };

  const handleAddDiscretionaryPoints = (points) => {
    const currentPoints = currentDayData.discretionaryPoints || 0;
    const updated = {
      ...currentDayData,
      discretionaryPoints: currentPoints + points,
      discretionaryReason: discretionaryReasonInput || 'Superb effort & behavior today! 🌟'
    };
    setDaysState(prev => ({ ...prev, [dateKey]: updated }));
    saveDayState(dateKey, updated);
    setDiscretionaryReasonInput('');
  };

  const handleClearDiscretionaryPoints = () => {
    const updated = {
      ...currentDayData,
      discretionaryPoints: 0,
      discretionaryReason: ''
    };
    setDaysState(prev => ({ ...prev, [dateKey]: updated }));
    saveDayState(dateKey, updated);
  };

  const handleBookChange = (index, value) => {
    const titles = [...booksState.titles];
    titles[index] = value;
    const count = titles.filter(t => t.trim() !== '').length;
    
    const updated = { count, titles };
    setBooksState(updated);
    saveBooksState(updated);
  };

  // --- GEMINI HANDLERS ---
  const handleDraftPraise = async () => {
    if (!apiKey) {
      setPraiseError("To use AI, please set your Gemini API key inside the app.tsx code!");
      return;
    }
    setIsDraftingPraise(true);
    setPraiseError('');
    try {
      const completedCount = getCompletedCountForDay(dateKey);
      const mood = currentDayData.mood || 'unspecified';
      const aidenComment = currentDayData.commentary || 'None';
      const appreciations = (currentDayData.appreciations || []).filter(a => a.trim() !== '').join(', ') || 'None';

      const prompt = `You are a loving, encouraging parent. Your son Aiden is doing a summer quest. Today he completed ${completedCount} out of 9 tasks. His mood today is "${mood}". His daily commentary is: "${aidenComment}". His appreciations today: "${appreciations}". Write a short (2-4 sentences), warm, and encouraging note to him praising his specific efforts today and giving him a little tip or hype for tomorrow. Keep it natural, highly positive, and write from the perspective of his parent addressing him directly. Do not include markdown.`;

      const text = await generateGeminiText(prompt);
      handleParentCommentChange(text);
    } catch (err) {
      console.error(err);
      setPraiseError('Could not connect to Gemini API. Check your key.');
    } finally {
      setIsDraftingPraise(false);
    }
  };

  const handleGenerateProject = async () => {
    if (!projectInterest.trim()) return;
    if (!apiKey) {
      setProjectIdea("Gemini API Key missing in app.tsx code. To run, add your key inside the code!");
      return;
    }
    setIsGeneratingIdea(true);
    setProjectIdea('');
    try {
      const prompt = `You are a fun, enthusiastic Summer Camp Coach. Aiden is looking for a cool, achievable summer project related to "${projectInterest}". Suggest ONE specific, fun project he can do over a few days. Format it beautifully with a catchy title, a 1-sentence description, and 3 easy bullet points to get started. Don't use markdown formatting, just plain text with emojis where appropriate.`;
      const text = await generateGeminiText(prompt);
      setProjectIdea(text);
    } catch (err) {
      console.error(err);
      setProjectIdea('Oops, the idea machine broke. Try again later!');
    } finally {
      setIsGeneratingIdea(false);
    }
  };

  const getCompletedCountForDay = (dayKey) => {
    const data = daysState[dayKey];
    if (!data || !data.completed) return 0;
    return Object.values(data.completed).filter(Boolean).length;
  };

  const getDatesWithPhotos = () => {
    return Object.keys(daysState).filter(
      key => daysState[key]?.skincarePhoto && key !== dateKey
    );
  };

  const filledAppreciationsCount = appreciationsList.filter(item => item.trim() !== '').length;
  const activeSpecialEvent = getDaySpecialEvent(selectedDate);
  const activeAcademics = getDayEvents(dateKey);

  const goNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    if (next <= END_DATE) setSelectedDate(next);
  };

  const goPrevDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    if (prev >= START_DATE) setSelectedDate(prev);
  };

  const getLast7DaysStats = () => {
    const stats = [];
    const tempDate = new Date(selectedDate);
    for (let i = 0; i < 7; i++) {
      const key = formatDateKey(tempDate);
      const dayData = daysState[key];
      stats.push({
        dateLabel: tempDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        completedCount: dayData ? Object.values(dayData.completed || {}).filter(Boolean).length : 0,
        mood: dayData ? dayData.mood : '',
        totalPoints: calculatePointsForDay(key).total
      });
      tempDate.setDate(tempDate.getDate() - 1);
    }
    return stats.reverse();
  };

  const last7Days = getLast7DaysStats();

  useEffect(() => {
    if (timelineRef.current) {
      const activeBtn = timelineRef.current.querySelector('.active-date-btn');
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [selectedDate]);

  const currentPointsSummary = calculatePointsForDay(dateKey);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-6">
        <RefreshCw className="w-10 h-10 text-indigo-400 animate-spin mb-4" />
        <h2 className="text-lg font-bold tracking-wide">Connecting Summer Quest...</h2>
        <p className="text-xs text-slate-400 mt-1">Establishing real-time cloud data streams</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-16">
      
      {/* Interactive Header with XP Progress */}
      <header className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-800 text-white shadow-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <Award className="w-7 h-7 text-yellow-300" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                Aiden's Summer Quest 2026 
                <span className="text-xs bg-emerald-500 text-white font-extrabold px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                  Live Sync
                </span>
              </h1>
              <p className="text-xs text-indigo-100 font-semibold">June 15 – August 13 • Mobile Responsive</p>
            </div>
          </div>

          {/* Gamified Rank Progress Widget */}
          <div className="flex items-center gap-3 bg-white/10 px-4 py-1.5 rounded-2xl border border-white/15 relative">
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-indigo-200">Total Score Tracker</div>
              <div className="text-sm font-black text-yellow-300">{cumulativePoints} Points</div>
            </div>
            <div className="h-8 w-[1px] bg-white/20" />
            <div className="text-left flex flex-col justify-center">
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${levelInfo.bg} ${levelInfo.color}`}>
                {levelInfo.title}
              </span>
              <div className="text-[9px] text-indigo-200 mt-1">
                {levelInfo.nextAt === 'MAX' ? 'Maximum Rank Unlocked!' : `Next rank at ${levelInfo.nextAt} pts`}
              </div>
            </div>

            <button 
              onClick={() => setIsRulesModalOpen(true)}
              className="ml-2 bg-indigo-500/30 hover:bg-indigo-500/60 text-white p-1.5 rounded-full transition-all"
              title="Point System Help Guide"
            >
              <Info className="w-4 h-4 text-yellow-300" />
            </button>
          </div>

          {/* Toggle Role Selector */}
          <div className="flex bg-indigo-950/40 p-1 rounded-xl border border-indigo-500/20 backdrop-blur-sm w-full sm:w-auto justify-center">
            <button
              onClick={() => setRole('aiden')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                role === 'aiden' 
                  ? 'bg-white text-indigo-900 shadow-md scale-105' 
                  : 'text-indigo-100 hover:bg-white/10'
              }`}
            >
              <User className="w-4 h-4" />
              Aiden Mode 👦
            </button>
            <button
              onClick={() => setRole('parent')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                role === 'parent' 
                  ? 'bg-white text-indigo-900 shadow-md scale-105' 
                  : 'text-indigo-100 hover:bg-white/10'
              }`}
            >
              <Users className="w-4 h-4" />
              Parents Mode 👪
            </button>
          </div>
        </div>
      </header>

      {/* Warning banner if running on default local fallbacks */}
      {!isFirebaseReady && (
        <div className="max-w-6xl mx-auto px-4 mt-4">
          <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3.5 rounded-xl text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-sm">
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span><strong>Local Storage Active:</strong> Connect your personal Firebase Config in the `app.tsx` file for real-time saving and sync on mobile!</span>
            </span>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* Aiden Mode: Reminder Alert Banner */}
        {role === 'aiden' && currentDayData.parentReminder && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-2xl shadow-sm flex items-start gap-3 animate-pulse">
            <Bell className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-extrabold text-sm text-yellow-800">Reminder from Parents! 👪</h4>
              <p className="text-xs text-yellow-700 mt-0.5">{currentDayData.parentReminder}</p>
            </div>
          </div>
        )}

        {/* 1. TIMELINE NAVIGATION STRIP */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <h2 className="font-bold text-slate-800 text-sm">Select Day (June 15 - August 13)</h2>
            </div>
            <div className="text-[11px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
              Day {ALL_DATES.findIndex(d => d.toDateString() === selectedDate.toDateString()) + 1} of {ALL_DATES.length}
            </div>
          </div>

          <div className="relative flex items-center">
            <button 
              onClick={goPrevDay}
              disabled={selectedDate.toDateString() === START_DATE.toDateString()}
              className="absolute left-0 z-10 bg-white/90 hover:bg-white p-1.5 rounded-full shadow-md border border-slate-200 disabled:opacity-45"
            >
              <ChevronLeft className="w-5 h-5 text-slate-700" />
            </button>

            <div 
              ref={timelineRef}
              className="flex gap-2 overflow-x-auto py-2 px-8 w-full scrollbar-none snap-x"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {ALL_DATES.map((date) => {
                const key = formatDateKey(date);
                const isSelected = date.toDateString() === selectedDate.toDateString();
                const specEvent = getDaySpecialEvent(date);
                const isCompleted = getCompletedCountForDay(key) >= 6; 
                const hasEvents = getDayEvents(key).length > 0;
                
                let highlightClass = "border-slate-200 hover:bg-slate-50";
                if (specEvent?.type === 'vacation') highlightClass = "border-amber-300 bg-amber-50/50";
                if (specEvent?.type === 'tkd') highlightClass = "border-red-300 bg-red-50/50";
                if (specEvent?.type === 'sports') highlightClass = "border-emerald-300 bg-emerald-50/50";
                if (isSelected) highlightClass = "ring-2 ring-indigo-600 border-indigo-600 bg-indigo-50 active-date-btn scale-105";

                return (
                  <button
                    key={key}
                    onClick={() => setSelectedDate(date)}
                    className={`flex-shrink-0 w-14 py-2 rounded-xl border flex flex-col items-center justify-center transition-all snap-center ${highlightClass}`}
                  >
                    <span className="text-[9px] uppercase font-bold text-slate-400">{getDayName(date)}</span>
                    <span className="text-base font-extrabold text-slate-800 leading-none my-0.5">{date.getDate()}</span>
                    
                    <div className="flex gap-0.5 mt-1">
                      {isCompleted && <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />}
                      {hasEvents && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />}
                      {specEvent && <span className={`w-1.5 h-1.5 rounded-full ${
                        specEvent.type === 'vacation' ? 'bg-amber-500' : specEvent.type === 'tkd' ? 'bg-red-500' : 'bg-emerald-500'
                      }`} />}
                    </div>
                  </button>
                );
              })}
            </div>

            <button 
              onClick={goNextDay}
              disabled={selectedDate.toDateString() === END_DATE.toDateString()}
              className="absolute right-0 z-10 bg-white/90 hover:bg-white p-1.5 rounded-full shadow-md border border-slate-200 disabled:opacity-45"
            >
              <ChevronRight className="w-5 h-5 text-slate-700" />
            </button>
          </div>
        </div>

        {/* GAMIFICATION POINTS BAR CARD */}
        <div className="bg-gradient-to-r from-amber-500 to-indigo-600 rounded-2xl shadow-lg border border-indigo-500/10 p-5 text-white flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2.5 rounded-xl">
              <Zap className="w-6 h-6 text-yellow-300 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">Point Calculation Summary</h3>
              <p className="text-xs text-indigo-100 mt-0.5">
                Earn up to 10 base points + additional bonuses. Click the <span className="text-yellow-300 font-bold hover:underline cursor-pointer" onClick={() => setIsRulesModalOpen(true)}>yellow "?" icon</span> above to see full rules.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 text-center bg-black/15 p-3 rounded-xl w-full sm:w-auto">
            <div className="px-2">
              <div className="text-[10px] text-indigo-200 uppercase font-bold">Base Tasks</div>
              <div className="text-lg font-extrabold text-yellow-300">{currentPointsSummary.base} <span className="text-xs">pts</span></div>
            </div>
            <div className="px-2 border-l border-white/10">
              <div className="text-[10px] text-indigo-200 uppercase font-bold">Appreciations</div>
              <div className="text-lg font-extrabold text-yellow-300">{filledAppreciationsCount === 10 ? "+3" : "0"} <span className="text-xs">pts</span></div>
            </div>
            <div className="px-2 border-l border-white/10">
              <div className="text-[10px] text-indigo-200 uppercase font-bold">Skin Photo</div>
              <div className="text-lg font-extrabold text-yellow-300">{currentDayData.skincarePhoto ? "+1" : "0"} <span className="text-xs">pts</span></div>
            </div>
            <div className="px-2 border-l border-white/10">
              <div className="text-[10px] text-indigo-200 uppercase font-bold">Discretionary</div>
              <div className="text-lg font-extrabold text-yellow-300">{currentPointsSummary.discretionary} <span className="text-xs">pts</span></div>
            </div>
          </div>
        </div>

        {/* 2. DYNAMIC SCHEDULE & BOOK GOALS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Day Status Card */}
          <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-bl-full pointer-events-none" />
            
            <div>
              <div className="text-xs font-bold text-indigo-600 tracking-wider uppercase mb-1">Active Day Planning</div>
              <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                {getFormattedDateLabel(selectedDate)} 
                <span className="text-slate-400 font-medium">({getDayName(selectedDate)})</span>
              </h2>

              {/* Show Special Event Banner */}
              {activeSpecialEvent && (
                <div className={`mt-4 p-4 rounded-xl border flex items-center gap-3 ${activeSpecialEvent.color}`}>
                  <Sparkles className="w-5 h-5 animate-spin text-amber-500" />
                  <div>
                    <h4 className="font-bold text-sm">Active Calendar Focus</h4>
                    <p className="text-xs opacity-90">{activeSpecialEvent.name}</p>
                  </div>
                </div>
              )}

              {/* Editable Daily Schedule */}
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Daily Schedule</h3>
                  <button 
                    onClick={() => setIsAddingEvent(!isAddingEvent)}
                    className="text-[10px] font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-2 py-1.5 rounded-md transition-all flex items-center gap-1 shadow-sm border border-indigo-100"
                  >
                    <Plus className="w-3 h-3" /> {isAddingEvent ? 'Cancel' : 'Add Event'}
                  </button>
                </div>
                
                <div className="grid gap-2">
                  {activeAcademics.length === 0 && !isAddingEvent && (
                    <div className="text-xs text-slate-400 italic p-3 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                      No events scheduled for today. Click "Add Event" to plan the day.
                    </div>
                  )}

                  {activeAcademics.map((cls) => (
                    <div 
                      key={cls.id} 
                      className={`flex items-center justify-between p-3 rounded-xl border group transition-colors ${
                        cls.conflict 
                          ? 'bg-amber-50 border-amber-200 text-amber-900 font-bold' 
                          : 'bg-indigo-50/50 border-indigo-100 text-indigo-900 hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Clock className={`w-4 h-4 ${cls.conflict ? 'text-amber-500' : 'text-indigo-500'}`} />
                        <span className="font-bold text-sm">{cls.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold">{cls.time}</span>
                        <button 
                          onClick={() => handleDeleteScheduleEvent(cls.id)}
                          className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-600 transition-opacity p-1 bg-white rounded-md shadow-sm border border-slate-100"
                          title="Remove Event"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Add Event Form */}
                  {isAddingEvent && (
                    <div className="flex items-center gap-2 p-2 rounded-xl border-2 border-indigo-200 bg-white shadow-sm mt-1 animate-in fade-in slide-in-from-top-2">
                      <input 
                        type="text" 
                        placeholder="Event Name (e.g. Science Class)" 
                        value={newEventName}
                        onChange={e => setNewEventName(e.target.value)}
                        className="flex-1 text-xs px-2 py-1.5 outline-none font-semibold text-slate-800 placeholder-slate-400"
                        autoFocus
                      />
                      <input 
                        type="text" 
                        placeholder="Time (e.g. 2:00 PM)" 
                        value={newEventTime}
                        onChange={e => setNewEventTime(e.target.value)}
                        className="w-28 text-xs px-2 py-1.5 outline-none border-l border-slate-100 placeholder-slate-400"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddScheduleEvent()}
                      />
                      <button 
                        onClick={handleAddScheduleEvent}
                        disabled={!newEventName.trim() || !newEventTime.trim()}
                        className="bg-indigo-600 disabled:bg-indigo-300 text-white p-1.5 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {isSportsCampDay(selectedDate) && activeAcademics.some(c => c.conflict) && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm">Overlap Warning!</h4>
                    <p className="text-xs text-amber-800 leading-relaxed mt-1">
                      Aiden has sports camp running from <strong>10:00 AM to 2:00 PM</strong>, which might clash directly with some schedules today! Please double check the times.
                    </p>
                  </div>
                </div>
              )}

              {activeSpecialEvent?.type === 'vacation' && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-100 text-blue-900 rounded-xl flex gap-3">
                  <Coffee className="w-5 h-5 text-blue-600 shrink-0" />
                  <div>
                    <h4 className="font-bold text-sm">Vacation Mode Active 🌴</h4>
                    <p className="text-xs text-blue-800 leading-relaxed mt-1">
                      Daily routines are optional or modified during vacation. Enjoy the family trip!
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Completion Bar */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="flex justify-between text-xs font-bold text-slate-500 mb-1.5">
                <span>Daily Quest Progress</span>
                <span>
                  {getCompletedCountForDay(dateKey)} / {DEFAULT_TASKS.length} Completed
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-600 h-full transition-all duration-500 rounded-full"
                  style={{ width: `${(getCompletedCountForDay(dateKey) / DEFAULT_TASKS.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Academic Book Tracker Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold text-indigo-600 tracking-wider uppercase mb-1">Summer Long-Term Milestone</div>
              <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-500" />
                Summer Reading
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Objective: Read <strong>4 complete books</strong> (no comic books) during summer break.
              </p>

              {/* Grid of Books */}
              <div className="mt-4 space-y-2">
                {booksState.titles.map((title, idx) => (
                  <div key={idx} className="relative">
                    <input
                      type="text"
                      placeholder={`Book Title ${idx + 1}...`}
                      value={title}
                      onChange={(e) => handleBookChange(idx, e.target.value)}
                      disabled={role !== 'aiden'}
                      className={`w-full text-xs px-3 py-2.5 border rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none pr-8 transition-all ${
                        title.trim() !== '' 
                          ? 'border-indigo-200 bg-indigo-50/20 text-indigo-900 font-bold' 
                          : 'border-slate-200'
                      }`}
                    />
                    {title.trim() !== '' && (
                      <CheckCircle className="w-4 h-4 text-emerald-500 absolute right-2.5 top-3" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                <span>Completed Books</span>
                <span className="text-indigo-600 font-bold">{booksState.count} / 4 Books</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-1.5">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-500 rounded-full"
                  style={{ width: `${(booksState.count / 4) * 100}%` }}
                />
              </div>
            </div>
          </div>

        </div>

        {/* 3. MAIN QUEST CHECKLIST & DAILY LOG */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          
          {/* Daily Checklist Column */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Checklist */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-indigo-600" />
                  Aiden's Daily Missions
                </h3>
                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                  Check box when completed
                </span>
              </div>

              <div className="space-y-3">
                {DEFAULT_TASKS.map((task) => {
                  const isChecked = !!currentDayData.completed?.[task.id];
                  
                  let catBadge = "bg-slate-100 text-slate-600";
                  if (task.category === 'music') catBadge = "bg-indigo-50 text-indigo-600 border border-indigo-100";
                  if (task.category === 'fitness') catBadge = "bg-rose-50 text-rose-600 border border-rose-100";
                  if (task.category === 'health') catBadge = "bg-emerald-50 text-emerald-600 border border-emerald-100";
                  if (task.category === 'habit') catBadge = "bg-amber-50 text-amber-600 border border-amber-100";
                  if (task.category === 'intellect') catBadge = "bg-purple-50 text-purple-600 border border-purple-100";

                  return (
                    <div 
                      key={task.id}
                      onClick={() => handleTaskToggle(task.id)}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer select-none transition-all ${
                        isChecked 
                          ? 'bg-emerald-50/40 border-emerald-200 text-slate-500' 
                          : 'bg-slate-50/50 border-slate-150 hover:border-slate-300'
                      }`}
                    >
                      <div className="mt-0.5">
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                          isChecked 
                            ? 'bg-emerald-500 border-emerald-500 text-white' 
                            : 'border-slate-300 bg-white hover:border-indigo-500'
                        }`}>
                          {isChecked && <CheckCircle className="w-4 h-4 stroke-[3]" />}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-sm font-bold ${isChecked ? 'line-through text-slate-400 font-medium' : 'text-slate-800'}`}>
                            {task.label}
                          </span>
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase shrink-0 ${catBadge}`}>
                            {task.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {task.detail}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Gratitude & Appreciation Log */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-pink-500/10 to-transparent rounded-bl-full pointer-events-none" />
              
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
                    <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
                    My 10 Daily Appreciations 🌟
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Write down 10 things you are appreciative of or happy about today! (+3 bonus points!)
                  </p>
                </div>
                
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  filledAppreciationsCount === 10 
                    ? 'bg-pink-100 text-pink-700 animate-pulse' 
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  <Star className={`w-3.5 h-3.5 ${filledAppreciationsCount === 10 ? 'fill-pink-500 text-pink-500' : 'text-slate-400'}`} />
                  {filledAppreciationsCount} / 10 Completed
                </div>
              </div>

              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-5">
                <div 
                  className="bg-gradient-to-r from-pink-500 to-rose-500 h-full transition-all duration-500"
                  style={{ width: `${(filledAppreciationsCount / 10) * 100}%` }}
                />
              </div>

              {/* Grid of 10 appreciation lines */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {appreciationsList.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-slate-50/50 p-2 rounded-xl border border-slate-100 hover:border-slate-200 transition-all">
                    <span className="text-xs font-black text-pink-400 w-5 text-right">{idx + 1}.</span>
                    <input
                      type="text"
                      placeholder="Today, I am happy about..."
                      value={item}
                      onChange={(e) => handleAppreciationChange(idx, e.target.value)}
                      disabled={role !== 'aiden'}
                      className={`flex-1 text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-pink-400 transition-all ${
                        item.trim() !== '' ? 'border-pink-200 font-medium text-slate-800' : 'text-slate-600'
                      }`}
                    />
                  </div>
                ))}
              </div>

              {filledAppreciationsCount === 10 && (
                <div className="mt-4 p-3 bg-pink-50 border border-pink-100 rounded-xl flex items-center justify-center gap-2 text-pink-800 text-xs font-bold">
                  <Sparkles className="w-4 h-4 text-pink-500 animate-bounce" />
                  Fantastic job, Aiden! You logged all 10 appreciations today! (+3 bonus points loaded!) ✨
                </div>
              )}
            </div>

            {/* AI Summer Project Brainstormer */}
            {role === 'aiden' && (
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-sm border border-indigo-100 p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-bl-full pointer-events-none" />
                
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-extrabold text-indigo-900 text-lg flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                      Project Idea Brainstormer
                    </h3>
                    <p className="text-xs text-indigo-700/70 mt-0.5">
                      Need an idea for your "Summer Project" task? Ask the AI Coach!
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 mb-4 relative z-10">
                  <input
                    type="text"
                    placeholder="What are you interested in? (e.g., Space, Coding, Bugs)"
                    value={projectInterest}
                    onChange={(e) => setProjectInterest(e.target.value)}
                    className="flex-1 text-xs px-3 py-2.5 bg-white border border-indigo-200 rounded-xl focus:ring-1 focus:ring-indigo-400 outline-none transition-all"
                  />
                  <button
                    onClick={handleGenerateProject}
                    disabled={isGeneratingIdea || !projectInterest.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shadow-sm"
                  >
                    {isGeneratingIdea ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    Coach ✨
                  </button>
                </div>

                {projectIdea && (
                  <div className="bg-white/80 p-4 rounded-xl border border-indigo-100 text-sm text-indigo-900 whitespace-pre-wrap leading-relaxed shadow-inner relative z-10 animate-in fade-in zoom-in-95">
                    {projectIdea}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Feedback, Reminders, and Insights Panel */}
          <div className="lg:col-span-2 space-y-6">

            {/* PARENT REMINDER & REWARDS CONTROL HUB */}
            {role === 'parent' && (
              <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 rounded-2xl shadow-sm border border-indigo-700/30 p-6 text-white">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-extrabold text-base">Parent Oversight & Encouragement Tools</h3>
                </div>
                <p className="text-[11px] text-indigo-200 leading-relaxed mb-4">
                  Send live screen reminders to Aiden or award discretionary extra points for spectacular conduct.
                </p>

                {/* Send Screen Reminder */}
                <div className="space-y-2 mb-5">
                  <label className="text-[10px] font-bold text-indigo-300 uppercase tracking-wide">
                    Set Live Alert Reminder
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      placeholder="E.g., Finish your piano practice before dinner!"
                      value={parentReminderInput}
                      onChange={(e) => setParentReminderInput(e.target.value)}
                      className="flex-1 text-xs px-3 py-2 bg-indigo-800/40 border border-indigo-700 rounded-xl focus:ring-1 focus:ring-indigo-400 outline-none text-white placeholder-indigo-400"
                    />
                    <button
                      onClick={handleSendReminder}
                      className="bg-indigo-50 hover:bg-indigo-600 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all active:scale-95"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Set
                    </button>
                  </div>
                  {currentDayData.parentReminder && (
                    <div className="bg-yellow-500/20 text-yellow-200 p-2.5 rounded-xl text-[10px] flex justify-between items-center mt-1 border border-yellow-500/30">
                      <span className="truncate pr-2"><strong>Active:</strong> "{currentDayData.parentReminder}"</span>
                      <button 
                        onClick={handleClearReminder}
                        className="text-xs text-red-300 hover:text-red-100 font-black px-1"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>

                {/* Discretionary Points Awarder */}
                <div className="space-y-2 pt-3 border-t border-indigo-800">
                  <label className="text-[10px] font-bold text-indigo-300 uppercase tracking-wide block">
                    Award Discretionary Bonus Points
                  </label>
                  <input 
                    type="text"
                    placeholder="Reason (e.g. Excellent piano concentration, loaded dishwasher)"
                    value={discretionaryReasonInput}
                    onChange={(e) => setDiscretionaryReasonInput(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-indigo-800/40 border border-indigo-700 rounded-xl focus:ring-1 focus:ring-indigo-400 outline-none text-white placeholder-indigo-400"
                  />
                  
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <div className="flex gap-1.5">
                      {[1, 2, 5].map((pointsValue) => (
                        <button
                          key={pointsValue}
                          onClick={() => handleAddDiscretionaryPoints(pointsValue)}
                          className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 px-3 py-1.5 rounded-lg text-xs font-black transition-all active:scale-95 flex items-center gap-0.5"
                        >
                          +{pointsValue}
                        </button>
                      ))}
                    </div>
                    {currentDayData.discretionaryPoints > 0 && (
                      <button
                        onClick={handleClearDiscretionaryPoints}
                        className="text-[10px] text-red-400 hover:text-red-300 font-bold"
                      >
                        Reset Daily Bonus
                      </button>
                    )}
                  </div>

                  {currentDayData.discretionaryPoints > 0 && (
                    <div className="bg-emerald-500/20 text-emerald-300 p-2.5 rounded-xl text-[10px] mt-2 border border-emerald-500/30 animate-in fade-in zoom-in-95">
                      <strong>+{currentDayData.discretionaryPoints} Points Awarded!</strong>
                      <p className="italic text-[9px] text-emerald-400 mt-0.5">"{currentDayData.discretionaryReason}"</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PARENT INSIGHTS & ANALYTICS PANEL */}
            {role === 'parent' && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-500" />
                    Last 7 Days Progress Insights
                  </h3>
                  <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">
                    Overview
                  </span>
                </div>

                <div className="space-y-2">
                  {last7Days.map((day, idx) => {
                    const moodEmoji = 
                      day.mood === 'awesome' ? '🌟' :
                      day.mood === 'good' ? '😊' :
                      day.mood === 'okay' ? '😐' :
                      day.mood === 'tired' ? '🔋' :
                      day.mood === 'rough' ? '😢' : '❓';

                    const percent = Math.min((day.completedCount / DEFAULT_TASKS.length) * 100, 100);

                    return (
                      <div key={idx} className="flex items-center gap-3 justify-between p-2 rounded-xl bg-slate-50/60 border border-slate-100/50">
                        <div className="w-14 shrink-0">
                          <span className="text-[10px] font-bold text-slate-600 block">{day.dateLabel}</span>
                        </div>
                        
                        <div className="flex-1 flex items-center gap-2">
                          <div className="flex-1 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${percent >= 100 ? 'bg-emerald-500' : percent >= 50 ? 'bg-indigo-500' : 'bg-rose-400'}`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 w-8">{day.completedCount}/9</span>
                        </div>

                        <div className="flex items-center gap-2 w-14 justify-end">
                          <span className="text-sm" title={`Mood: ${day.mood || 'Unlogged'}`}>{moodEmoji}</span>
                          <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-extrabold">{day.totalPoints}xp</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Acne Skincare Progress Photo Journal */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-bl-full pointer-events-none" />
              
              <div className="flex items-center gap-2 mb-2">
                <Camera className="w-5 h-5 text-emerald-500" />
                <h3 className="font-extrabold text-slate-800 text-base">Acne Skincare Tracker 🧴</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Take or upload a daily photo to track acne recovery. (+1 overachievement bonus point!)
              </p>

              <div className="grid grid-cols-2 gap-4">
                
                {/* LHS: Today's Photo Box */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Today's Skin Photo</span>
                  {currentDayData.skincarePhoto ? (
                    <div className="relative group rounded-xl overflow-hidden aspect-square border border-emerald-200 bg-slate-50">
                      <img 
                        src={currentDayData.skincarePhoto} 
                        alt="Aiden's skin today" 
                        className="w-full h-full object-cover"
                      />
                      {role === 'aiden' && (
                        <button
                          onClick={handleDeletePhoto}
                          className="absolute bottom-2 right-2 bg-rose-500/90 text-white p-1 rounded-lg text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600 shadow-md"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="aspect-square border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-3 text-center bg-slate-50/50">
                      <ImageIcon className="w-6 h-6 text-slate-300 mb-2" />
                      {role === 'aiden' ? (
                        <label className="cursor-pointer bg-white border border-slate-200 shadow-sm px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                          <span>Snap / Upload</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            capture="user" 
                            onChange={handlePhotoUpload} 
                            className="hidden" 
                          />
                        </label>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 italic">No photo logged</span>
                      )}
                    </div>
                  )}
                </div>

                {/* RHS: Comparative Photo Box */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Compare Skin With</span>
                  
                  {getDatesWithPhotos().length > 0 ? (
                    <div className="space-y-2">
                      <select
                        value={compareDateKey}
                        onChange={(e) => setCompareDateKey(e.target.value)}
                        className="w-full text-[10px] py-1 px-1.5 border border-slate-200 rounded-lg outline-none bg-white font-semibold text-slate-700"
                      >
                        <option value="">-- Choose Date --</option>
                        {getDatesWithPhotos().map((key) => {
                          const dateObj = new Date(key);
                          return (
                            <option key={key} value={key}>
                              {dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </option>
                          );
                        })}
                      </select>

                      {compareDateKey && daysState[compareDateKey]?.skincarePhoto ? (
                        <div className="rounded-xl overflow-hidden aspect-square border border-slate-200 bg-slate-50">
                          <img 
                            src={daysState[compareDateKey].skincarePhoto} 
                            alt="Skin comparison" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="aspect-square border-dashed border border-slate-100 rounded-xl flex items-center justify-center p-3 text-center bg-slate-50/20 text-slate-300">
                          <Columns className="w-6 h-6 mb-1" />
                          <span className="text-[9px] font-bold leading-tight animate-pulse">Select date above to compare</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="aspect-square border border-dashed border-slate-100 rounded-xl flex flex-col items-center justify-center p-3 text-center bg-slate-50/20 text-slate-300">
                      <Info className="w-5 h-5 mb-1.5 text-slate-300" />
                      <span className="text-[9px] font-bold leading-tight text-slate-400 leading-relaxed">
                        Compare options appear once Aiden logs multiple photos!
                      </span>
                    </div>
                  )}
                </div>

              </div>

              {currentDayData.skincarePhoto && compareDateKey && (
                <div className="mt-3 p-2 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-1.5 text-[10px] text-emerald-800 font-bold justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                  Showing results side-by-side! Consistency with daily acne skincare pays off. Keep it up!
                </div>
              )}
            </div>

            {/* Aiden's Log */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2 mb-4">
                <Smile className="w-5 h-5 text-amber-500" />
                Aiden's Corner 👦
              </h3>

              {/* Mood selector */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Aiden's Mood Checker</label>
                <div className="flex justify-between gap-1 mt-2">
                  {[
                    { id: 'awesome', emoji: '🌟', label: 'Awesome' },
                    { id: 'good', emoji: '😊', label: 'Good' },
                    { id: 'okay', emoji: '😐', label: 'Okay' },
                    { id: 'tired', emoji: '🔋', label: 'Tired' },
                    { id: 'rough', emoji: '😢', label: 'Rough' }
                  ].map((m) => {
                    const isSelected = currentDayData.mood === m.id;
                    return (
                      <button
                        key={m.id}
                        disabled={role !== 'aiden'}
                        onClick={() => handleMoodSelect(m.id)}
                        className={`flex-1 flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                          isSelected 
                            ? 'bg-amber-50 border-amber-400 scale-105 ring-1 ring-amber-300' 
                            : 'border-slate-100 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-xl">{m.emoji}</span>
                        <span className="text-[10px] font-bold mt-1 text-slate-600">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Commentary */}
              <div className="mt-5">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                    How was your day? (Aiden's Commentary)
                  </label>
                  {role !== 'aiden' && (
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                      Read Only for Parents
                    </span>
                  )}
                </div>
                <textarea
                  rows="3"
                  disabled={role !== 'aiden'}
                  placeholder="Aiden: Write down a note about what you did today, and what you liked!"
                  value={currentDayData.commentary || ''}
                  onChange={(e) => handleCommentaryChange(e.target.value)}
                  className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* Parent Feedback */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-500" />
                  Parents' Response Journal 👪
                </h3>
                {role === 'parent' && (
                  <button
                    onClick={handleDraftPraise}
                    disabled={isDraftingPraise}
                    className="text-[10px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 border border-indigo-100 disabled:opacity-50"
                    title="Use Gemini AI to draft an encouraging note based on today's stats"
                  >
                    {isDraftingPraise ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                    Draft Praise ✨
                  </button>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                    Encouragement & Praise Notes
                  </label>
                  {role !== 'parent' && (
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                      Read Only for Aiden
                    </span>
                  )}
                </div>
                <textarea
                  rows="3"
                  disabled={role !== 'parent'}
                  placeholder="Leave words of praise for Aiden today! Well done or tip notes."
                  value={currentDayData.parentComment || ''}
                  onChange={(e) => handleParentCommentChange(e.target.value)}
                  className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:ring-1 focus:ring-rose-500 outline-none resize-none leading-relaxed"
                />
                {praiseError && <p className="text-[10px] text-red-500 mt-1">{praiseError}</p>}
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* --- POINT RULES HELP MODAL --- */}
      {isRulesModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 text-slate-700">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col">
            
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-indigo-600 to-indigo-800 text-white rounded-t-2xl">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-300" />
                <h3 className="font-bold text-base">Summer Quest Rules & Points Guide</h3>
              </div>
              <button 
                onClick={() => setIsRulesModalOpen(false)}
                className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 text-sm">
              
              <div className="space-y-3">
                <h4 className="font-extrabold text-indigo-900 border-b pb-1 flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-indigo-600" />
                  1. Base Daily Missions (Up to 10 Points)
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Aiden has 9 missions on his daily list. Points are awarded progressively only if he finishes at least <strong>5 out of 9 (50%)</strong> tasks.
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex justify-between border-b border-slate-200 pb-1">
                    <span className="text-slate-500 font-semibold">0–4 Tasks</span>
                    <span className="font-extrabold text-rose-600">0 pts</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-1">
                    <span className="text-slate-500 font-semibold">5 Tasks (50%+)</span>
                    <span className="font-extrabold text-slate-800">2 pts</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-1">
                    <span className="text-slate-500 font-semibold">6 Tasks</span>
                    <span className="font-extrabold text-slate-800">4 pts</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-1">
                    <span className="text-slate-500 font-semibold">7 Tasks</span>
                    <span className="font-extrabold text-slate-800">6 pts</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">8 Tasks</span>
                    <span className="font-extrabold text-slate-800">8 pts</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">9 Tasks (100%)</span>
                    <span className="font-extrabold text-indigo-600">10 pts</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-extrabold text-indigo-900 border-b pb-1 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-pink-500" />
                  2. Overachievement Bonuses (Up to +4 Points)
                </h4>
                <ul className="text-xs space-y-2 text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="text-pink-500 font-bold">•</span>
                    <div>
                      <strong>Gratitude & Appreciations (+3 pts):</strong> Complete all 10 appreciation inputs in the Reflection Journal.
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <div>
                      <strong>Skin Progress Snapshot (+1 pt):</strong> Take or upload a skincare photo in the Acne tracker.
                    </div>
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-extrabold text-indigo-900 border-b pb-1 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-500" />
                  3. Parents' Discretionary Bonuses
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Parents can add extra point bundles (<strong>+1, +2, or +5 points</strong>) during active reviews in Parents Mode to honor focus, exceptional helpfulness, or wonderful behavior!
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <h4 className="font-extrabold text-indigo-900 border-b pb-1 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-yellow-500" />
                  4. Summer Prestige Rankings (XP Levels)
                </h4>
                <div className="space-y-2 text-xs text-white">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-600 font-bold">
                    <span>🌱 Level 1: Fresh Adventurer</span>
                    <span>0 – 29 pts</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-amber-500 font-bold">
                    <span>⚡ Level 2: Keen Learner</span>
                    <span>30 – 74 pts</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-rose-500 font-bold">
                    <span>🔥 Level 3: Daily Ranger</span>
                    <span>75 – 149 pts</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-blue-600 font-bold">
                    <span>🌟 Level 4: Elite Trailblazer</span>
                    <span>150 – 299 pts</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-purple-600 font-bold">
                    <span>👑 Level 5: Summer Champion</span>
                    <span>300+ pts</span>
                  </div>
                </div>
              </div>

            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center rounded-b-2xl">
              <span className="text-[10px] text-slate-400 font-mono select-all">
                Sync ID: {user?.uid || 'Local Mode'}
              </span>
              <button 
                onClick={() => setIsRulesModalOpen(false)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2 rounded-xl transition-all shadow-md"
              >
                Let's level up!
              </button>
            </div>

          </div>
        </div>
      )}

      <footer className="max-w-6xl mx-auto px-4 mt-10 text-center text-xs text-slate-400">
        <p>© 2026 Aiden's Summer Dashboard. Real-time Cloud Sync Active.</p>
      </footer>
    </div>
  );
}
