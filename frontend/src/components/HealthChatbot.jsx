import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { getPrescriptions } from '../services/api.js'

function createMessageId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `msg-${Math.random().toString(36).slice(2)}`
}

export default function HealthChatbot() {
  const { email } = useAuth()
  const [messages, setMessages] = useState([
    { id: 1, text: '👋 Hello! I\'m your AI Health Assistant. I can help you with:\n\n• Symptom analysis and home care advice\n• Medication explanations and how they work\n• General health and wellness guidance\n• When to seek medical attention\n\nWhat health concern can I help you with today?', sender: 'bot' }
  ])
  const [input, setInput] = useState('')
  const [prescriptions, setPrescriptions] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState('en')
  const [isRecording, setIsRecording] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const recognitionRef = useRef(null)

  const languages = {
    en: { name: 'English', flag: '🇺🇸' },
    hi: { name: 'हिंदी', flag: '🇮🇳' },
    ur: { name: 'اردو', flag: '🇵🇰' },
    ar: { name: 'العربية', flag: '🇸🇦' },
    es: { name: 'Español', flag: '🇪🇸' },
    fr: { name: 'Français', flag: '🇫🇷' }
  }

  // Simple translation function (in a real app, you'd use a translation API)
  const translateText = (text, targetLang) => {
    if (targetLang === 'en') return text

    // Basic translations for common health terms
    const translations = {
      hi: {
        'Hello': 'नमस्ते',
        'headache': 'सिरदर्द',
        'fever': 'बुखार',
        'cough': 'खांसी',
        'stomach': 'पेट',
        'pain': 'दर्द',
        'medicine': 'दवाई',
        'doctor': 'डॉक्टर',
        'emergency': 'आपातकाल',
        'symptoms': 'लक्षण',
        'treatment': 'इलाज',
        'prevention': 'रोकथाम',
        'exercise': 'व्यायाम',
        'diet': 'आहार',
        'sleep': 'नींद',
        'health': 'स्वास्थ्य'
      },
      ur: {
        'Hello': 'ہیلو',
        'headache': 'سر درد',
        'fever': 'بخار',
        'cough': 'کھانسی',
        'stomach': 'پیٹ',
        'pain': 'درد',
        'medicine': 'دوائی',
        'doctor': 'ڈاکٹر',
        'emergency': 'ہنگامی صورتحال',
        'symptoms': 'علامات',
        'treatment': 'علاج',
        'prevention': 'روک تھام',
        'exercise': 'ورزش',
        'diet': 'غذا',
        'sleep': 'نیند',
        'health': 'صحت'
      },
      ar: {
        'Hello': 'مرحبا',
        'headache': 'صداع',
        'fever': 'حمى',
        'cough': 'سعال',
        'stomach': 'معدة',
        'pain': 'ألم',
        'medicine': 'دواء',
        'doctor': 'طبيب',
        'emergency': 'طوارئ',
        'symptoms': 'أعراض',
        'treatment': 'علاج',
        'prevention': 'وقاية',
        'exercise': 'تمرين',
        'diet': 'نظام غذائي',
        'sleep': 'نوم',
        'health': 'صحة'
      },
      es: {
        'Hello': 'Hola',
        'headache': 'dolor de cabeza',
        'fever': 'fiebre',
        'cough': 'tos',
        'stomach': 'estómago',
        'pain': 'dolor',
        'medicine': 'medicina',
        'doctor': 'médico',
        'emergency': 'emergencia',
        'symptoms': 'síntomas',
        'treatment': 'tratamiento',
        'prevention': 'prevención',
        'exercise': 'ejercicio',
        'diet': 'dieta',
        'sleep': 'sueño',
        'health': 'salud'
      },
      fr: {
        'Hello': 'Bonjour',
        'headache': 'mal de tête',
        'fever': 'fièvre',
        'cough': 'toux',
        'stomach': 'estomac',
        'pain': 'douleur',
        'medicine': 'médicament',
        'doctor': 'médecin',
        'emergency': 'urgence',
        'symptoms': 'symptômes',
        'treatment': 'traitement',
        'prevention': 'prévention',
        'exercise': 'exercice',
        'diet': 'régime',
        'sleep': 'sommeil',
        'health': 'santé'
      }
    }

    const langTranslations = translations[targetLang] || {}
    let translatedText = text

    Object.keys(langTranslations).forEach(english => {
      const regex = new RegExp(`\\b${english}\\b`, 'gi')
      translatedText = translatedText.replace(regex, langTranslations[english])
    })

    return translatedText
  }

  // Voice functions
  const startVoiceRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice recognition is not supported in your browser. Please use Chrome, Edge, or Safari.')
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    recognitionRef.current = new SpeechRecognition()
    recognitionRef.current.continuous = false
    recognitionRef.current.interimResults = false
    recognitionRef.current.lang = selectedLanguage + '-' + selectedLanguage.toUpperCase()

    recognitionRef.current.onstart = () => {
      setIsRecording(true)
    }

    recognitionRef.current.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setInput(transcript)
      setIsRecording(false)
    }

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      setIsRecording(false)
      alert('Voice recognition failed. Please try again or type your message.')
    }

    recognitionRef.current.onend = () => {
      setIsRecording(false)
    }

    recognitionRef.current.start()
  }

  const stopVoiceRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }

  const speakResponse = (text) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = selectedLanguage + '-' + selectedLanguage.toUpperCase()
    utterance.rate = 0.9
    utterance.pitch = 1

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    window.speechSynthesis.speak(utterance)
  }

  // File handling
  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload images (JPG, PNG, GIF) or documents (PDF, DOC, DOCX).')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB.')
      return
    }

    // Create file message
    const fileMessage = {
      id: Date.now(),
      type: 'file',
      file: file,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      sender: 'user'
    }

    setMessages(prev => [...prev, fileMessage])

    // Simulate bot analyzing the file
    setTimeout(() => {
      let analysis = ''
      if (file.type.startsWith('image/')) {
        analysis = `📸 I've received your image "${file.name}". For medical images (skin conditions, wounds, rashes), I recommend:\n\n• Show this to your healthcare provider for proper diagnosis\n• Take clear, well-lit photos from multiple angles\n• Include a reference object (like a coin) for size comparison\n• Note when symptoms started and any treatments tried\n\n⚠️ I cannot diagnose from images. Please consult a medical professional.`
      } else {
        analysis = `📄 I've received your document "${file.name}". For medical documents (prescriptions, lab reports, medical records):\n\n• Keep these documents safe and organized\n• Share relevant documents with your healthcare providers\n• Ask your doctor to explain any results you don't understand\n• Store digital copies securely\n\nIf you have questions about this document, please ask!`
      }

      const botResponse = {
        id: Date.now() + 1,
        text: analysis,
        sender: 'bot'
      }

      setMessages(prev => [...prev, botResponse])
      if (voiceEnabled) speakResponse(analysis)
    }, 2000)
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  useEffect(() => {
    // Load prescriptions for medication explanations
    async function loadPrescriptions() {
      const userPrescriptions = await getPrescriptions()
      setPrescriptions(userPrescriptions.filter((p) => p.patientEmail === email))
    }

    loadPrescriptions()
  }, [email])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(scrollToBottom, [messages])

  const getBotResponse = (userMessage) => {
    const message = userMessage.toLowerCase()

    // Emergency detection - highest priority
    const emergencyKeywords = ['chest pain', 'difficulty breathing', 'severe bleeding', 'unconscious', 'heart attack', 'stroke', 'poisoning', 'emergency']
    if (emergencyKeywords.some(keyword => message.includes(keyword))) {
      return '🚨 EMERGENCY ALERT: This sounds like a medical emergency! Please call emergency services (911) immediately or go to the nearest emergency room. Do not wait - get help right now!'
    }

    // Severe symptoms that need immediate attention
    if (message.includes('severe pain') || message.includes('intense pain') || message.includes('worst pain ever')) {
      return '⚠️ Severe pain requires immediate medical attention. Please contact your doctor or go to urgent care. Don\'t ignore severe symptoms.'
    }

    // Symptom identification with detailed responses
    if (message.includes('headache') || message.includes('head ache') || message.includes('migraine')) {
      return `Headaches can have many causes. Here's what you should know:

• **Common causes**: Stress, dehydration, lack of sleep, eye strain, tension, or sinus issues
• **Home remedies**: Rest in a dark, quiet room, apply cold compress, stay hydrated, try relaxation techniques
• **When to see a doctor**: If headaches are severe, sudden, or accompanied by nausea, vision changes, or neck stiffness
• **Prevention**: Regular sleep schedule, stress management, proper hydration, regular exercise

For mild headaches, over-the-counter pain relievers like ibuprofen or acetaminophen may help.`
    }

    if (message.includes('fever') || message.includes('temperature') || message.includes('hot')) {
      return `Fever is your body's natural defense against infection. Here's the guidance:

• **Normal range**: 98.6°F (37°C) is average, but varies by person
• **When to worry**: Fever over 103°F (39.4°C), lasting more than 3 days, or with severe symptoms
• **Management**: Rest, stay hydrated, dress lightly, use fever-reducing medication if needed
• **When to seek help**: Infants under 3 months, anyone with weakened immune system, or if fever doesn't respond to medication

Remember: Fever itself isn't dangerous - it's usually a sign your body is fighting something.`
    }

    if (message.includes('cough') || message.includes('coughing')) {
      return `Coughs are common but can indicate different issues:

• **Types**: Dry cough (no mucus) vs Wet cough (with mucus)
• **Common causes**: Viral infections, allergies, asthma, acid reflux, or irritants
• **Home care**: Honey in warm water, humidifier, stay hydrated, avoid irritants
• **When to see doctor**: Cough lasting >3 weeks, blood in sputum, shortness of breath, chest pain, or high fever

For productive coughs, expectorant medications can help. For dry coughs, suppressants may be appropriate.`
    }

    if (message.includes('stomach') || message.includes('nausea') || message.includes('vomit') || message.includes('throw up')) {
      return `Stomach issues can be uncomfortable. Here's what to know:

• **Possible causes**: Food poisoning, viral infection, stress, medication side effects, or digestive disorders
• **Immediate relief**: Sip clear fluids slowly, eat bland foods (BRAT diet: bananas, rice, applesauce, toast)
• **Hydration**: Important! Dehydration can worsen symptoms
• **When to seek care**: Severe dehydration signs (dark urine, dizziness), blood in vomit/stool, severe abdominal pain, or symptoms lasting >2 days

Avoid solid foods until nausea subsides, then gradually reintroduce bland foods.`
    }

    if (message.includes('sore throat') || message.includes('throat pain')) {
      return `Sore throats are usually viral but can be bacterial:

• **Common causes**: Viral infections (most common), bacterial infections (strep), allergies, dry air
• **Relief measures**: Salt water gargles, honey, throat lozenges, humidifier, warm fluids
• **Strep throat signs**: White patches on throat, fever, no cough, swollen glands
• **When to see doctor**: Difficulty swallowing/breathing, high fever, rash, or symptoms lasting >1 week

Most sore throats resolve in 5-7 days with supportive care.`
    }

    if (message.includes('back pain') || message.includes('backache')) {
      return `Back pain affects most people at some point:

• **Common causes**: Muscle strain, poor posture, lifting injuries, or degenerative changes
• **Acute care**: Rest 1-2 days, ice/heat, over-the-counter pain relievers, gentle stretching
• **Prevention**: Good posture, regular exercise, proper lifting techniques, maintain healthy weight
• **Red flags**: Pain radiating down legs, numbness, weakness, bowel/bladder changes, or pain worse at night

Most back pain improves with conservative treatment within 4-6 weeks.`
    }

    if (message.includes('joint pain') || message.includes('arthritis') || message.includes('joint')) {
      return `Joint pain can significantly impact mobility:

• **Common causes**: Osteoarthritis (wear and tear), rheumatoid arthritis, injury, gout, or infection
• **Management**: Regular exercise, weight management, anti-inflammatory medications, heat/cold therapy
• **When to see doctor**: Severe pain, swelling, redness, warmth, or reduced range of motion
• **Prevention**: Maintain healthy weight, stay active, protect joints during activities

Early treatment can prevent further joint damage.`
    }

    if (message.includes('fatigue') || message.includes('tired') || message.includes('exhausted')) {
      return `Chronic fatigue can have many underlying causes:

• **Possible causes**: Sleep disorders, anemia, thyroid issues, depression, chronic fatigue syndrome, or lifestyle factors
• **Assessment**: Track your sleep, diet, stress levels, and daily activities
• **Basic tips**: Maintain consistent sleep schedule, regular exercise, balanced nutrition, stress management
• **When to seek help**: Fatigue lasting >2 weeks, interfering with daily activities, or accompanied by other symptoms

Don't ignore persistent fatigue - it could signal an underlying health condition.`
    }

    if (message.includes('anxiety') || message.includes('stress') || message.includes('worried')) {
      return `Mental health is just as important as physical health:

• **Common symptoms**: Excessive worry, restlessness, fatigue, difficulty concentrating, sleep issues
• **Coping strategies**: Deep breathing exercises, regular exercise, adequate sleep, healthy diet, social support
• **Professional help**: Consider talking to a counselor or therapist if anxiety interferes with daily life
• **Resources**: Many communities offer mental health support services

You're not alone - many people experience anxiety, and help is available.`
    }

    // Medication explanations with detailed information
    if (message.includes('why') && (message.includes('medicine') || message.includes('medication') || message.includes('pill') || message.includes('drug'))) {
      const medName = message.match(/(?:why|what).*?(?:take|for)\s+(\w+)/i)?.[1]
      if (medName) {
        const med = prescriptions.find(p => p.medication.toLowerCase().includes(medName.toLowerCase()))
        if (med) {
          return `Based on your prescription for ${med.medication}:

**Purpose**: ${getMedicationPurpose(med.medication)}

**How it works**: ${getMedicationMechanism(med.medication)}

**Important notes**:
• Take exactly as prescribed by your doctor
• Don't stop without consulting your doctor
• Report any side effects immediately
• Store properly and check expiration dates

Always follow your doctor's specific instructions for your condition.`
        }
      }
      return 'I can explain your prescribed medications in detail. Please tell me which specific medication you\'d like to know about (e.g., "Why do I take metformin?").'
    }

    // General health advice with more detail
    if (message.includes('exercise') || message.includes('workout') || message.includes('physical activity')) {
      return `Regular exercise is crucial for health. Here's comprehensive guidance:

**Recommended amounts**:
• Adults: 150 minutes moderate aerobic activity OR 75 minutes vigorous activity per week
• Plus: Strength training 2x per week for all major muscle groups

**Benefits**: Improved cardiovascular health, stronger bones, better mood, weight management, reduced disease risk

**Getting started**:
• Start slow and gradually increase intensity
• Choose activities you enjoy
• Consult your doctor before starting new programs
• Include both cardio and strength training

**Tips**: Find a workout buddy, track your progress, mix up activities to stay motivated.`
    }

    if (message.includes('diet') || message.includes('eat') || message.includes('food') || message.includes('nutrition')) {
      return `A healthy diet supports overall wellness. Here's what to focus on:

**Key principles**:
• Eat a variety of colorful fruits and vegetables (5+ servings daily)
• Choose whole grains over refined grains
• Include lean proteins (fish, poultry, beans, nuts)
• Limit processed foods, added sugars, and saturated fats
• Stay hydrated (8+ glasses of water daily)

**Meal planning**:
• Breakfast: Whole grain cereal with fruit and nuts
• Lunch/Dinner: Lean protein, vegetables, whole grains
• Snacks: Fresh fruits, vegetables, yogurt, nuts

**Special considerations**: Age, activity level, and health conditions affect nutritional needs. Consider consulting a registered dietitian for personalized advice.`
    }

    if (message.includes('sleep') || message.includes('insomnia')) {
      return `Quality sleep is essential for health and recovery:

**Recommended amounts**:
• Adults: 7-9 hours per night
• Teens: 8-10 hours
• Children: 9-12 hours

**Sleep hygiene tips**:
• Consistent sleep/wake times
• Cool, dark, quiet bedroom
• No screens 1 hour before bed
• Relaxing bedtime routine
• Regular exercise (not close to bedtime)

**If you have trouble sleeping**:
• Avoid caffeine after noon
• Create a comfortable sleep environment
• Try relaxation techniques
• Consider seeing a doctor if problems persist

Poor sleep can affect mood, concentration, and overall health.`
    }

    if (message.includes('blood pressure') || message.includes('hypertension')) {
      return `Blood pressure management is crucial for heart health:

**Normal ranges**:
• Normal: <120/80 mmHg
• Elevated: 120-129 (systolic) and <80
• High: ≥130/80 mmHg

**Management strategies**:
• DASH diet (fruits, vegetables, whole grains, lean proteins)
• Reduce sodium intake (<2,300 mg daily)
• Regular exercise
• Maintain healthy weight
• Limit alcohol and quit smoking
• Stress management

**Monitoring**: Regular check-ups and home monitoring if advised by your doctor.

High blood pressure often has no symptoms but can lead to serious complications.`
    }

    if (message.includes('diabetes') || message.includes('blood sugar')) {
      return `Diabetes management requires consistent care:

**Key aspects**:
• Blood sugar monitoring
• Healthy eating (balanced carbs, proteins, fats)
• Regular physical activity
• Medication adherence
• Regular medical check-ups

**Blood sugar goals** (discuss with your doctor):
• Before meals: 80-130 mg/dL
• 2 hours after meals: <180 mg/dL
• A1C: <7% (individualized)

**Prevention of complications**:
• Foot care, eye exams, kidney function tests
• Cardiovascular risk management
• Regular dental care

Work closely with your healthcare team for personalized management.`
    }

    // Preventive care and wellness
    if (message.includes('checkup') || message.includes('physical') || message.includes('screening')) {
      return `Regular health screenings save lives:

**Recommended screenings by age**:
• **20s-30s**: Blood pressure, cholesterol, BMI, mental health
• **40s-50s**: Mammograms (women), colon cancer screening, diabetes screening
• **50s+**: Bone density, hearing/vision tests, additional cancer screenings

**Annual check-ups should include**:
• Vital signs (BP, heart rate, weight)
• Physical examination
• Blood tests as appropriate
• Health counseling and vaccinations

Stay current with recommended screenings based on your age, gender, and risk factors.`
    }

    if (message.includes('vaccine') || message.includes('vaccination') || message.includes('shot')) {
      return `Vaccinations protect against serious diseases:

**Adult vaccination schedule**:
• Annual flu shot
• Tdap booster every 10 years
• Shingles vaccine (age 50+)
• Pneumonia vaccine (age 65+ or with certain conditions)
• COVID-19 boosters as recommended

**Benefits**: Prevent serious illness, protect vulnerable populations, reduce healthcare costs

**Safety**: Vaccines undergo rigorous testing and monitoring. Side effects are usually mild and temporary.

Stay up-to-date with your vaccinations - they're one of the most effective preventive health measures.`
    }

    // Greeting and general conversation
    if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
      return 'Hello! I\'m your health assistant, ready to help with symptoms, medication questions, and general health advice. What health concern can I address for you today?'
    }

    if (message.includes('how are you') || message.includes('how do you do')) {
      return 'I\'m functioning optimally and ready to help you with your health questions! How can I assist you today?'
    }

    if (message.includes('thank') || message.includes('thanks')) {
      return 'You\'re very welcome! Remember, I provide general health information to support your healthcare journey. For personalized medical advice, always consult your healthcare provider. Is there anything else I can help you with?'
    }

    if (message.includes('bye') || message.includes('goodbye')) {
      return 'Take care of yourself! Remember to stay healthy, follow your doctor\'s advice, and don\'t hesitate to reach out if you have more health questions. Goodbye!'
    }

    // Default response with helpful suggestions
    return `I'm here to help with your health questions! I can assist with:

• **Symptom information**: Understanding what your symptoms might mean
• **Medication explanations**: Why you take specific medicines and how they work
• **Health advice**: Diet, exercise, sleep, and wellness tips
• **Preventive care**: Screenings, vaccinations, and healthy habits

Please ask me something specific like:
• "I have a sore throat, what should I do?"
• "Why do I take lisinopril?"
• "How much exercise should I get?"
• "What should I eat for better health?"

What would you like to know about your health?`
  }

  const getMedicationPurpose = (medication) => {
    const med = medication.toLowerCase()
    if (med.includes('ibuprofen') || med.includes('advil') || med.includes('motrin')) {
      return 'reducing pain, fever, and inflammation (NSAID - Non-Steroidal Anti-Inflammatory Drug)'
    }
    if (med.includes('acetaminophen') || med.includes('tylenol') || med.includes('paracetamol')) {
      return 'reducing pain and fever'
    }
    if (med.includes('aspirin')) {
      return 'reducing pain, fever, inflammation, and preventing blood clots'
    }
    if (med.includes('amoxicillin') || med.includes('penicillin')) {
      return 'fighting bacterial infections'
    }
    if (med.includes('lisinopril') || med.includes('enalapril')) {
      return 'lowering blood pressure and protecting heart function (ACE inhibitor)'
    }
    if (med.includes('metformin')) {
      return 'managing blood sugar levels in type 2 diabetes'
    }
    if (med.includes('atorvastatin') || med.includes('lipitor') || med.includes('simvastatin')) {
      return 'lowering cholesterol levels to reduce heart disease risk (statin)'
    }
    if (med.includes('omeprazole') || med.includes('prilosec')) {
      return 'reducing stomach acid production (proton pump inhibitor)'
    }
    if (med.includes('levothyroxine') || med.includes('synthroid')) {
      return 'replacing thyroid hormone in hypothyroidism'
    }
    if (med.includes('sertraline') || med.includes('zoloft')) {
      return 'treating depression and anxiety (SSRI antidepressant)'
    }
    if (med.includes('albuterol') || med.includes('ventolin')) {
      return 'opening airways in asthma and COPD (bronchodilator)'
    }
    if (med.includes('warfarin') || med.includes('coumadin')) {
      return 'preventing blood clots (anticoagulant/blood thinner)'
    }
    if (med.includes('prednisone')) {
      return 'reducing inflammation and suppressing immune response (corticosteroid)'
    }
    if (med.includes('furosemide') || med.includes('lasix')) {
      return 'removing excess fluid from the body (diuretic/water pill)'
    }
    return 'treating your specific medical condition as prescribed by your doctor'
  }

  const getMedicationMechanism = (medication) => {
    const med = medication.toLowerCase()
    if (med.includes('ibuprofen') || med.includes('advil')) {
      return 'It blocks enzymes that produce prostaglandins, which cause pain and inflammation in the body.'
    }
    if (med.includes('acetaminophen') || med.includes('tylenol')) {
      return 'It works in the brain to reduce pain perception and lower fever by affecting the hypothalamus.'
    }
    if (med.includes('aspirin')) {
      return 'It inhibits platelet aggregation to prevent blood clots and reduces inflammation by blocking COX enzymes.'
    }
    if (med.includes('amoxicillin')) {
      return 'It prevents bacteria from forming cell walls, causing them to die and clearing the infection.'
    }
    if (med.includes('lisinopril')) {
      return 'It relaxes blood vessels by blocking the conversion of angiotensin I to angiotensin II, reducing blood pressure.'
    }
    if (med.includes('metformin')) {
      return 'It reduces glucose production in the liver and improves insulin sensitivity in muscle cells.'
    }
    if (med.includes('atorvastatin')) {
      return 'It inhibits an enzyme needed for cholesterol production in the liver, lowering LDL ("bad") cholesterol.'
    }
    if (med.includes('omeprazole')) {
      return 'It blocks the proton pump in stomach cells, reducing acid production and allowing ulcers to heal.'
    }
    if (med.includes('levothyroxine')) {
      return 'It provides synthetic thyroid hormone to replace what the body isn\'t producing enough of.'
    }
    if (med.includes('sertraline')) {
      return 'It increases serotonin levels in the brain, helping regulate mood and reduce anxiety symptoms.'
    }
    if (med.includes('albuterol')) {
      return 'It relaxes the muscles around airways, opening them up for easier breathing during asthma attacks.'
    }
    if (med.includes('warfarin')) {
      return 'It interferes with vitamin K-dependent clotting factors, making blood less likely to clot.'
    }
    if (med.includes('prednisone')) {
      return 'It mimics cortisol to reduce inflammation and suppress the immune system\'s overactive response.'
    }
    if (med.includes('furosemide')) {
      return 'It blocks sodium and chloride reabsorption in the kidneys, causing increased urine production to remove excess fluid.'
    }
    return 'It works through specific mechanisms to address your medical condition as determined by your healthcare provider.'
  }

  const quickQuestions = [
    "I have a headache",
    "Why do I take my medication?",
    "How much exercise should I get?",
    "What should I eat for better health?",
    "I'm feeling anxious"
  ]

  const handleQuickQuestion = (question) => {
    setInput(question)
    handleSend()
  }

  const clearChat = () => {
    setMessages([
      { id: 1, text: '👋 Hello! I\'m your AI Health Assistant. I can help you with:\n\n• Symptom analysis and home care advice\n• Medication explanations and how they work\n• General health and wellness guidance\n• When to seek medical attention\n\nWhat health concern can I help you with today?', sender: 'bot' }
    ])
    setInput('')
    setIsTyping(false)
  }

  const handleSend = () => {
    if (!input.trim()) return

    const userMessage = { id: createMessageId(), text: input, sender: 'user' }
    setMessages(prev => [...prev, userMessage])
    const currentInput = input
    setInput('')
    setIsTyping(true)

    // Simulate bot response delay
    setTimeout(() => {
      const botResponseText = getBotResponse(currentInput)
      const translatedResponse = translateText(botResponseText, selectedLanguage)

      const botResponse = {
        id: createMessageId(),
        text: translatedResponse,
        sender: 'bot'
      }

      setMessages(prev => [...prev, botResponse])
      setIsTyping(false)

      // Speak response if voice is enabled
      if (voiceEnabled) {
        speakResponse(translatedResponse)
      }
    }, 1500) // Slightly longer delay for more realistic feel
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-96 bg-white rounded-lg border border-slate-200">
      <div className="flex items-center justify-between p-3 border-b border-slate-200">
        <h3 className="text-sm font-medium text-slate-900">AI Health Assistant</h3>
        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="text-xs border border-slate-300 rounded px-2 py-1"
          >
            {Object.entries(languages).map(([code, lang]) => (
              <option key={code} value={code}>
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>

          {/* Voice Toggle */}
          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`text-xs px-2 py-1 rounded ${
              voiceEnabled ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
            }`}
            title={voiceEnabled ? 'Disable voice responses' : 'Enable voice responses'}
          >
            🔊
          </button>

          <button
            onClick={clearChat}
            className="text-xs text-slate-500 hover:text-slate-700 underline"
          >
            Clear chat
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.type === 'file' ? (
              <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex items-center gap-2">
                  {msg.fileType.startsWith('image/') ? (
                    <img
                      src={URL.createObjectURL(msg.file)}
                      alt={msg.fileName}
                      className="w-16 h-16 object-cover rounded"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-blue-100 rounded flex items-center justify-center">
                      📄
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-blue-900">{msg.fileName}</p>
                    <p className="text-xs text-blue-600">
                      {(msg.fileSize / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                msg.sender === 'user'
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-100 text-slate-900'
              }`}>
                <p className="text-sm whitespace-pre-line">{msg.text}</p>
              </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-100 text-slate-900 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-1">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
                <span className="text-xs text-slate-500 ml-2">AI is typing...</span>
              </div>
            </div>
          </div>
        )}
        {isSpeaking && (
          <div className="flex justify-start">
            <div className="bg-green-100 text-green-900 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-1">
                <span className="text-xs">🔊 Speaking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      {messages.length === 1 && (
        <div className="border-t border-slate-200 p-3">
          <p className="text-xs text-slate-600 mb-2">Quick questions:</p>
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleQuickQuestion(question)}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded-full transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-slate-200 p-4">
        <div className="flex gap-2">
          {/* File Upload Button */}
          <button
            onClick={openFileDialog}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="Upload photo or document"
          >
            📎
          </button>

          {/* Voice Recording Button */}
          <button
            onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
            className={`p-2 rounded-lg transition-colors ${
              isRecording
                ? 'bg-red-100 text-red-600 animate-pulse'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}
            title={isRecording ? 'Stop recording' : 'Start voice input'}
          >
            {isRecording ? '⏹️' : '🎤'}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about symptoms, medications, or health advice..."
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
            disabled={isTyping}
          />

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={isTyping || !input.trim()}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx"
          onChange={handleFileUpload}
          className="hidden"
        />

        <p className="mt-2 text-xs text-slate-500">
          ⚠️ This is for general information only. Consult your doctor for medical advice.
        </p>
      </div>
    </div>
  )
}