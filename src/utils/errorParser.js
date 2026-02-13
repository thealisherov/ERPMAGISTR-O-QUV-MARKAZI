/**
 * parseDeleteError - Backend delete xatolarini tahlil qilib,
 * foydalanuvchiga tushunarli xabar qaytaradi.
 * 
 * Backend odatda constraint violation xatolarini qaytaradi:
 * - Foreign key constraint (guruh, to'lov, davomat va boshqalar)
 * - 403 Forbidden (ruxsat yo'q)
 * - 404 Not Found (topilmadi)
 * - 409 Conflict (ziddiyat)
 * - 500 Internal Server Error
 */

const constraintMessages = {
  // Student related
  'group_students': "Bu foydalanuvchi guruhga qo'shilgan. Avval uni guruhdan olib tashlang.",
  'payment': "Bu foydalanuvchining to'lovlari mavjud. Avval to'lovlarni o'chiring.",
  'attendance': "Bu foydalanuvchining davomat yozuvlari mavjud.",
  'leaderboard': "Bu foydalanuvchining reyting (leaderboard) yozuvlari mavjud.",
  'coin': "Bu foydalanuvchiga coinlar berilgan. Avval coin yozuvlarini o'chiring.",
  'submission': "Bu foydalanuvchining test natijalari mavjud.",
  
  // Teacher related
  'group': "Bu o'qituvchiga guruhlar biriktirilgan. Avval guruhlarni boshqa o'qituvchiga o'tkazing.",
  'teacher': "Bu o'qituvchiga bog'liq ma'lumotlar mavjud.",
  
  // Generic
  'foreign key': "Bu foydalanuvchiga bog'liq ma'lumotlar mavjud. Avval bog'liq ma'lumotlarni o'chiring.",
  'constraint': "Bu foydalanuvchiga bog'liq ma'lumotlar mavjud. O'chirib bo'lmaydi.",
  'reference': "Bu foydalanuvchiga boshqa joyda murojaat qilingan. O'chirib bo'lmaydi.",
};

const statusMessages = {
  403: "Sizda bu foydalanuvchini o'chirish huquqi yo'q.",
  404: "Foydalanuvchi topilmadi. Ehtimol allaqachon o'chirilgan.",
  409: "Bu foydalanuvchi bilan bog'liq ziddiyat mavjud.",
};

export const parseDeleteError = (error, entityType = 'Foydalanuvchi') => {
  const status = error.response?.status;
  const data = error.response?.data;
  
  // 1. Status code bo'yicha aniq xabar
  if (status && statusMessages[status]) {
    return statusMessages[status];
  }

  // 2. Backend xabarini tahlil qilish
  const errorMessage = typeof data === 'string' 
    ? data 
    : data?.message || data?.error || '';

  const lowerMessage = errorMessage.toLowerCase();

  // 3. Constraint violation xabarlarini tekshirish
  for (const [keyword, message] of Object.entries(constraintMessages)) {
    if (lowerMessage.includes(keyword.toLowerCase())) {
      return message;
    }
  }

  // 4. Umumiy constraint xatosi
  if (status === 500 && (
    lowerMessage.includes('constraint') || 
    lowerMessage.includes('violation') ||
    lowerMessage.includes('foreign') ||
    lowerMessage.includes('integrity') ||
    lowerMessage.includes('cannot delete') ||
    lowerMessage.includes('referenced')
  )) {
    return `Diqqat! Bu ${entityType.toLowerCase()} tizimda faol ishlatilmoqda.\n\n` +
           `O'chirish uchun quyidagilarni tekshiring:\n` +
           `1. Guruhdan chiqarilganmi?\n` +
           `2. To'lovlari mavjudmi?\n` +
           `3. Davomat yozuvlari bormi?\n\n` +
           `Avval barcha bog'liq ma'lumotlarni o'chirishingiz yoki foydalanuvchini guruhdan chiqarishingiz kerak.`;
  }

  // 5. Agar backend xabar qaytargan bo'lsa — uni ko'rsatish
  if (errorMessage && errorMessage.length > 0 && errorMessage.length < 200) {
    return "Xatolik: " + errorMessage;
  }

  // 6. Umumiy xabar
  if (status === 500) {
    return `${entityType}ni o'chirish yoki o'zgartirishda tizim xatosi yuz berdi (500).`;
  }

  return `${entityType} operatsiyasida kutilmagan xatolik yuz berdi.`;
};
