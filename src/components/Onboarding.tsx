import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from '../i18n';
import { Check, ChevronRight, MessageCircle } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
  telegramUser: any;
}

export default function Onboarding({ onComplete, telegramUser }: OnboardingProps) {
  const { lang, setLang } = useTranslation();
  const [step, setStep] = useState(1);

  const languages = [
    { code: 'uz', name: "O'zbekcha" },
    { code: 'en', name: "English" },
    { code: 'ru', name: "Русский" },
    { code: 'qq', name: "Qaraqalpaqsha" },
    { code: 'kk', name: "Қазақша" }
  ];

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else onComplete();
  };

  const getStepText = (stepNum: number, key: string) => {
    const texts: Record<string, any> = {
      uz: {
        s1t: "Tilni tanlang", s1d: "Ilovadan qaysi tilda foydalanishni xohlaysiz?",
        s2t: `Salom, ${telegramUser?.first_name || "Foydalanuvchi"}!`,
        s2d: "Siz ushbu Telegram akkauntingiz orqali tizimga kiryapsiz. Qabul qilasizmi?",
        s2b: "Ha, shu akkaunt orqali kirish",
        s3t: "Ajoyib!", s3d: "Endi o'z maqsadlaringizni yaratishingiz va mablag'ingizni rejalashtirishingiz mumkin. Boshlashga tayyormisiz?",
        next: "Keyingisi", start: "Boshlash"
      },
      ru: {
        s1t: "Выберите язык", s1d: "На каком языке вы хотите использовать приложение?",
        s2t: `Привет, ${telegramUser?.first_name || "Пользователь"}!`,
        s2d: "Вы входите через этот аккаунт Telegram. Подтверждаете?",
        s2b: "Да, войти через этот аккаунт",
        s3t: "Отлично!", s3d: "Теперь вы можете создавать свои цели и планировать бюджет. Готовы начать?",
        next: "Далее", start: "Начать"
      },
      en: {
        s1t: "Select Language", s1d: "Which language do you want to use the app in?",
        s2t: `Hello, ${telegramUser?.first_name || "User"}!`,
        s2d: "You are logging in with this Telegram account. Do you accept?",
        s2b: "Yes, log in with this account",
        s3t: "Great!", s3d: "Now you can create your goals and plan your budget. Ready to start?",
        next: "Next", start: "Start"
      },
      qq: {
        s1t: "Tildi tańlań", s1d: "Qosımshadan qaysı tilde paydalanıwdı qáleysiz?",
        s2t: `Sálem, ${telegramUser?.first_name || "Paydalanıwshı"}!`,
        s2d: "Siz usı Telegram akkauntıńız arqalı sistemaǵa kirmekte siz. Qabil etesiz be?",
        s2b: "Awa, usı akkaunt arqalı kiriw",
        s3t: "Oǵadá jaqsı!", s3d: "Endi óz maqsetlerińizdi jaratıwıńız hám qarjılarıńızdı rejelestiriwińiz múmkin. Baslawǵa tayyarsız ba?",
        next: "Keyingisi", start: "Baslaw"
      },
      kk: {
        s1t: "Тілді таңдаңыз", s1d: "Қосымшаны қай тілде пайдаланғыңыз келеді?",
        s2t: `Сәлем, ${telegramUser?.first_name || "Қолданушы"}!`,
        s2d: "Сіз осы Telegram аккаунты арқылы кіріп жатырсыз. Қабылдайсыз ба?",
        s2b: "Иә, осы аккаунтпен кіру",
        s3t: "Керемет!", s3d: "Енді өз мақсаттарыңызды құрып, қаражатыңызды жоспарлай аласыз. Бастауға дайынсыз ба?",
        next: "Келесі", start: "Бастау"
      }
    };
    return texts[lang as string]?.[key] || texts['uz'][key];
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-slate-50 dark:bg-slate-900 px-6 py-12 text-slate-800 dark:text-slate-200">
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-sm flex flex-col items-center"
          >
            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-500/20 rounded-full flex items-center justify-center mb-6">
              <MessageCircle className="w-8 h-8 text-indigo-500" />
            </div>
            <h2 className="text-2xl font-display font-semibold mb-2 text-center text-slate-900 dark:text-white">
              {getStepText(1, 's1t')}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8 text-center text-sm">
              {getStepText(1, 's1d')}
            </p>
            
            <div className="w-full space-y-3 mb-8">
              {languages.map(l => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code as any)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    lang === l.code 
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 shadow-sm' 
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className={`font-medium ${lang === l.code ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>
                    {l.name}
                  </span>
                  {lang === l.code && <Check className="w-5 h-5 text-indigo-500" />}
                </button>
              ))}
            </div>
            
            <button
              onClick={handleNext}
              className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white rounded-2xl font-medium transition-colors flex items-center justify-center group"
            >
              {getStepText(1, 'next')}
              <ChevronRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-sm flex flex-col items-center"
          >
            <div className="mb-6 relative">
              {telegramUser?.photo_url ? (
                <img 
                  src={telegramUser.photo_url} 
                  alt="Avatar" 
                  className="w-24 h-24 rounded-full object-cover border-4 border-indigo-100 dark:border-indigo-500/20"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center border-4 border-indigo-100 dark:border-indigo-500/20">
                  <span className="text-3xl text-indigo-500 font-medium">
                    {telegramUser?.first_name?.charAt(0) || "U"}
                  </span>
                </div>
              )}
              <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            </div>
            
            <h2 className="text-2xl font-display font-semibold mb-2 text-center text-slate-900 dark:text-white">
              {getStepText(2, 's2t')}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8 text-center text-sm">
              {getStepText(2, 's2d')}
            </p>

            <button
              onClick={handleNext}
              className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white rounded-2xl font-medium transition-colors mb-4 flex justify-center items-center"
            >
              {getStepText(2, 's2b')}
            </button>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-sm flex flex-col items-center"
          >
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
              <span className="text-4xl">🚀</span>
            </div>
            <h2 className="text-3xl font-display font-semibold mb-4 text-center text-slate-900 dark:text-white">
              {getStepText(3, 's3t')}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-10 text-center leading-relaxed">
              {getStepText(3, 's3d')}
            </p>

            <button
              onClick={handleNext}
              className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white rounded-2xl font-medium transition-colors flex items-center justify-center shadow-lg shadow-indigo-500/25"
            >
              {getStepText(3, 'start')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
