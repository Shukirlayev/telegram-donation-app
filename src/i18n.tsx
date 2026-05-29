import React, { createContext, useContext, useState } from 'react';

type Language = 'uz' | 'ru' | 'en';

export const translations = {
  uz: {
    greeting: {
       morning: "Xayrli tong",
       day: "Xayrli kun",
       evening: "Xayrli kech",
       night: "Xayrli tun",
       welcome: "Xush kelibsiz"
    },
    nav: {
       home: "Asosiy",
       stats: "Statistika",
       profile: "Profil"
    },
    header: {
       totalSaved: "Jami Yig'ildi",
       stats: "Statistika",
       profile: "Profil sozlamalari",
       user: "Foydalanuvchi"
    },
    home: {
       millionaire: "Millioner!",
       millionSaved: "1M+ UZS yig'ildi",
       streak: "Kun",
       activeStreak: "Faol seriya",
       aiConsult: "Moliya AI",
       aiNoGoals: "Sizda hali maqsadlar yo'q. Birinchi maqsadingizni yarating!",
       aiStart: "Ajoyib boshlanish! Maqsad yaratibsiz, endi unga pul ajrating.",
       aiMillion: "Siz 1 Million UZS dan ortiq mablag' yig'ishga muvaffaq bo'ldingiz! Ajoyib natija! \uD83D\uDD25",
       aiProgress: "Siz umumiy hisobda {amount} UZS yig'dingiz. Rejali tejashni davom ettirsangiz, barchasiga tezda erishasiz.",
       goals: "Maqsadlar",
       add: "Qo'shish",
       newCategory: "Yangi Kategoriya",
       name: "Nomi",
       namePlaceholder: "Masalan: Noutbuk",
       amount: "Maqsad summasi (UZS)",
       deadline: "Muddat (Ixtiyoriy)",
       saving: "Saqlanmoqda...",
       save: "Saqlash",
       cancel: "Bekor",
       noGoalsTitle: "Hali maqsad qo'shilmagan.",
       noGoalsDesc: "Pul yig'ishni boshlash uchun kategoriya yaratib uni tanlang",
       deadlineEnd: "Muddat tugallandi",
       daysLeft: "kun qoldi",
       deadlinePassed: "Muddat o'tdi",
       perDay: "UZS / kun",
       recentActivity: "So'nggi harakatlar",
       noActivity: "Harakatlar mavjud emas.",
       archived: "Arxivlangan",
       target: "Maqsad:"
    },
    stats: {
       distribution: "Taqsimot",
       noGoals: "Hozircha maqsadlar yo'q",
       noFunds: "Maqsadlarga hali pul ajratilmagan",
       savings7days: "Oxirgi 7 Kundagi Tejashlar",
       saved: "Tejaldi",
       funds: "Mablag'lar"
    },
    profile: {
       settings: "Sozlamalar",
       namePlaceholder: "Ismingiz...",
       hidden: "Yashirin",
       appVersion: "Ilova versiyasi",
       mainSettings: "ASOSIY SOZLAMALAR",
       language: "Ilova tili",
       languageNames: { uz: "O'zbekcha", ru: "Русский", en: "English" },
       languageModalTitle: "Tilni tanlang",
       currency: "Asosiy valyuta",
       currencyOnly: "Faqat UZS valyutasi qo'llab-quvvatlanadi",
       notifications: "Bildirishnomalar",
       on: "Yoqilgan",
       off: "O'ch.",
       darkMode: "Tungi rejim",
       auto: "Avto",
       securityGroup: "XAVFSIZLIK",
       pinCode: "PIN-kod o'rnatish",
       infoGroup: "MA'LUMOT",
       help: "Yordam va qoidalar",
       downloadTx: "Tranzaksiyalarni yuklash",
       downloadGoals: "Maqsadlarni yuklash",
       exit: "Chiqish / Yopish"
    }
  },
  ru: {
    greeting: {
       morning: "Доброе утро",
       day: "Добрый день",
       evening: "Добрый вечер",
       night: "Доброй ночи",
       welcome: "Добро пожаловать"
    },
    nav: {
       home: "Главная",
       stats: "Статистика",
       profile: "Профиль"
    },
    header: {
       totalSaved: "Всего накоплено",
       stats: "Статистика",
       profile: "Настройки профиля",
       user: "Пользователь"
    },
    home: {
       millionaire: "Миллионер!",
       millionSaved: "Накоплено 1M+ UZS",
       streak: "Дней",
       activeStreak: "Активная серия",
       aiConsult: "Финансы AI",
       aiNoGoals: "У вас пока нет целей. Создайте свою первую цель!",
       aiStart: "Отличное начало! Цель создана, теперь выделите на нее средства.",
       aiMillion: "Вы смогли накопить более 1 миллиона UZS! Отличный результат! \uD83D\uDD25",
       aiProgress: "Вы накопили в общей сложности {amount} UZS. Продолжайте планировать сбережения, и вы быстро достигнете всего.",
       goals: "Цели",
       add: "Добавить",
       newCategory: "Новая категория",
       name: "Название",
       namePlaceholder: "Например: Ноутбук",
       amount: "Сумма цели (UZS)",
       deadline: "Срок (Необязательно)",
       saving: "Сохранение...",
       save: "Сохранить",
       cancel: "Отмена",
       noGoalsTitle: "Цели пока не добавлены.",
       noGoalsDesc: "Создайте категорию и выберите её, чтобы начать копить деньги",
       deadlineEnd: "Срок истек",
       daysLeft: "дней осталось",
       deadlinePassed: "Срок прошел",
       perDay: "UZS / день",
       recentActivity: "Последние действия",
       noActivity: "Нет действий.",
       archived: "Архивировано",
       target: "Цель:"
    },
    stats: {
       distribution: "Распределение",
       noGoals: "Пока нет целей",
       noFunds: "Средства на цели пока не выделены",
       savings7days: "Сбережения за 7 дней",
       saved: "Накоплено",
       funds: "Средства"
    },
    profile: {
       settings: "Настройки",
       namePlaceholder: "Ваше имя...",
       hidden: "Скрыт",
       appVersion: "Версия приложения",
       mainSettings: "ОСНОВНЫЕ НАСТРОЙКИ",
       language: "Язык приложения",
       languageNames: { uz: "O'zbekcha", ru: "Русский", en: "English" },
       languageModalTitle: "Выберите язык",
       currency: "Основная валюта",
       currencyOnly: "Поддерживается только валюта UZS",
       notifications: "Уведомления",
       on: "Вкл.",
       off: "Выкл.",
       darkMode: "Ночной режим",
       auto: "Авто",
       securityGroup: "БЕЗОПАСНОСТЬ",
       pinCode: "Установить PIN-код",
       infoGroup: "ИНФОРМАЦИЯ",
       help: "Помощь и правила",
       downloadTx: "Скачать транзакции",
       downloadGoals: "Скачать цели",
       exit: "Выйти / Закрыть"
    }
  },
  en: {
    greeting: {
       morning: "Good morning",
       day: "Good afternoon",
       evening: "Good evening",
       night: "Good night",
       welcome: "Welcome"
    },
    nav: {
       home: "Home",
       stats: "Stats",
       profile: "Profile"
    },
    header: {
       totalSaved: "Total Saved",
       stats: "Statistics",
       profile: "Profile Settings",
       user: "User"
    },
    home: {
       millionaire: "Millionaire!",
       millionSaved: "Saved 1M+ UZS",
       streak: "Days",
       activeStreak: "Active streak",
       aiConsult: "Finance AI",
       aiNoGoals: "You have no goals yet. Create your first goal!",
       aiStart: "Great start! You created a goal, now allocate funds to it.",
       aiMillion: "You have successfully saved more than 1 Million UZS! Great result! \uD83D\uDD25",
       aiProgress: "You have saved a total of {amount} UZS. Keep saving systematically and you will reach your goals quickly.",
       goals: "Goals",
       add: "Add",
       newCategory: "New Category",
       name: "Name",
       namePlaceholder: "e.g., Laptop",
       amount: "Target Amount (UZS)",
       deadline: "Deadline (Optional)",
       saving: "Saving...",
       save: "Save",
       cancel: "Cancel",
       noGoalsTitle: "No goals added yet.",
       noGoalsDesc: "Create a category and select it to start saving money",
       deadlineEnd: "Deadline Reached",
       daysLeft: "days left",
       deadlinePassed: "Deadline Passed",
       perDay: "UZS / day",
       recentActivity: "Recent Activity",
       noActivity: "No activity yet.",
       archived: "Archived",
       target: "Target:"
    },
    stats: {
       distribution: "Distribution",
       noGoals: "No goals yet",
       noFunds: "No funds allocated to goals yet",
       savings7days: "Savings (Last 7 Days)",
       saved: "Saved",
       funds: "Funds"
    },
    profile: {
       settings: "Settings",
       namePlaceholder: "Your name...",
       hidden: "Hidden",
       appVersion: "App Version",
       mainSettings: "MAIN SETTINGS",
       language: "App Language",
       languageNames: { uz: "O'zbekcha", ru: "Русский", en: "English" },
       languageModalTitle: "Select Language",
       currency: "Main Currency",
       currencyOnly: "Only UZS currency is supported",
       notifications: "Notifications",
       on: "On",
       off: "Off",
       darkMode: "Dark Mode",
       auto: "Auto",
       securityGroup: "SECURITY",
       pinCode: "Set PIN Code",
       infoGroup: "INFORMATION",
       help: "Help & Rules",
       downloadTx: "Download Transactions",
       downloadGoals: "Download Goals",
       exit: "Exit / Close"
    }
  }
};

const LanguageContext = createContext<{
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string, variables?: Record<string, string | number>) => string;
} | null>(null);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLangState] = useState<Language>(() => {
    return (localStorage.getItem('app_lang') as Language) || 'uz';
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('app_lang', newLang);
  };

  const t = (key: string, variables?: Record<string, string | number>) => {
    const keys = key.split('.');
    let result: any = translations[lang];
    for (const k of keys) {
      if (result === undefined) break;
      result = result[k];
    }
    
    if (typeof result === 'string' && variables) {
      Object.entries(variables).forEach(([vKey, vVal]) => {
        result = result.replace(`{${vKey}}`, vVal.toString());
      });
      return result;
    }
    
    return typeof result === 'string' ? result : key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useTranslation must be used within LanguageProvider");
  return context;
};
