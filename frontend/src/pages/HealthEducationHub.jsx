import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import {
	ArrowTopRightOnSquareIcon,
	BellAlertIcon,
	BuildingLibraryIcon,
	CalendarIcon,
	CheckCircleIcon,
	ClockIcon,
	DocumentTextIcon,
	HeartIcon,
	MagnifyingGlassIcon,
	PlayIcon,
	QuestionMarkCircleIcon,
	UserIcon,
} from '@heroicons/react/24/outline'
import Card from '../components/ui/Card.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import {
	deleteWomenHealthReminder,
	getHealthEducationSupportPrograms,
	getWomenHealthReminders,
	saveWomenHealthReminder,
	updateWomenHealthReminder,
} from '../services/api.js'

const categories = [
	{ id: 'all', name: 'All Topics', icon: '🏥' },
	{ id: 'cardiovascular', name: 'Cardiovascular', icon: '🫀' },
	{ id: 'nutrition', name: 'Nutrition', icon: '🥗' },
	{ id: 'mental-health', name: 'Mental Health', icon: '🧠' },
	{ id: 'preventive-care', name: 'Preventive Care', icon: '🛡️' },
	{ id: 'women-health', name: 'Women Health', icon: '🌸' },
]

const articles = [
	{
		id: 1,
		category: 'cardiovascular',
		image: '❤️',
		title: 'Heart-Healthy Diet: Daily Habits That Matter',
		summary: 'Simple nutrition and activity choices that support blood pressure control and long-term heart health.',
		author: 'Dr. Neha Verma',
		readTime: '6 min',
		publishDate: '2026-03-12',
		tags: ['heart', 'diet', 'prevention'],
	},
	{
		id: 2,
		category: 'mental-health',
		image: '🧘',
		title: 'Stress Management for Busy Families',
		summary: 'Practical breathing, sleep, and scheduling strategies that reduce daily stress and improve focus.',
		author: 'Dr. Karan Shah',
		readTime: '8 min',
		publishDate: '2026-03-10',
		tags: ['stress', 'sleep', 'wellness'],
	},
	{
		id: 3,
		category: 'preventive-care',
		image: '🩺',
		title: 'Annual Preventive Screening Guide',
		summary: 'A practical checklist for blood tests, vaccines, cancer screening, and follow-up care by age group.',
		author: 'Care Team',
		readTime: '5 min',
		publishDate: '2026-03-09',
		tags: ['screening', 'vaccines', 'checkup'],
	},
	{
		id: 4,
		category: 'nutrition',
		image: '🥣',
		title: 'Smart Meal Planning for Diabetes Prevention',
		summary: 'Use plate balance, fiber-rich foods, and portion awareness to improve glucose control before problems grow.',
		author: 'Nutrition Desk',
		readTime: '7 min',
		publishDate: '2026-03-08',
		tags: ['nutrition', 'diabetes', 'meal-plan'],
	},
	{
		id: 5,
		category: 'women-health',
		image: '🌸',
		title: 'Women Health Basics Across Life Stages',
		summary: 'A simple overview of cycle health, pregnancy care, bone strength, and menopause support.',
		author: 'Women Wellness Desk',
		readTime: '9 min',
		publishDate: '2026-03-07',
		tags: ['women', 'hormones', 'bone-health'],
	},
]

const videos = [
	{
		id: 1,
		category: 'cardiovascular',
		title: 'Understanding Blood Pressure Readings',
		description: 'Learn what systolic and diastolic numbers mean and when professional advice is necessary.',
		author: 'City Care Hospital',
		duration: '9:20',
		views: '12K',
		thumbnail: '🎥',
	},
	{
		id: 2,
		category: 'nutrition',
		title: 'Meal Planning for Diabetes Prevention',
		description: 'A practical walkthrough of balanced plates, grocery choices, and simple weekly meal prep.',
		author: 'Nutrition Desk',
		duration: '11:10',
		views: '8K',
		thumbnail: '🥦',
	},
]

const guides = [
	{
		id: 1,
		category: 'preventive-care',
		icon: '📋',
		title: 'Annual Health Checkup Checklist',
		description: 'Use this checklist before your next doctor visit so important questions and tests are not missed.',
		steps: ['Book your annual exam', 'Carry medication details', 'Track symptoms for two weeks', 'Complete advised blood tests'],
	},
	{
		id: 2,
		category: 'nutrition',
		icon: '🍽️',
		title: 'Healthy Eating Plate Method',
		description: 'A quick meal structure that improves balance, satiety, and portion control.',
		steps: ['Half plate vegetables', 'One quarter whole grains', 'One quarter lean protein', 'Prefer water over sugary drinks'],
	},
]

const quizzes = [
	{
		id: 1,
		category: 'preventive-care',
		title: 'Preventive Care Quick Quiz',
		questions: [
			{
				question: 'How often should most adults check blood pressure at minimum?',
				options: ['Only when sick', 'At least once a year', 'Every five years', 'Never needed'],
				correct: 1,
			},
			{
				question: 'Which is a core preventive habit?',
				options: ['Skipping sleep', 'Routine physical activity', 'Ignoring symptoms', 'Self-medicating antibiotics'],
				correct: 1,
			},
		],
	},
]

const womenLifeStages = [
	{
		id: 'teen',
		label: 'Teen (13-19)',
		focus: 'Focus on period education, acne and hormonal awareness, safe exercise, and iron-rich meals.',
	},
	{
		id: 'reproductive',
		label: 'Reproductive (20-35)',
		focus: 'Track cycle regularity, fertility awareness, thyroid health, and stress recovery.',
	},
	{
		id: 'pregnancy',
		label: 'Pregnancy / Postpartum',
		focus: 'Keep up with trimester visits, supplements, breastfeeding support, and postpartum mental health checks.',
	},
	{
		id: 'perimenopause',
		label: 'Perimenopause / Menopause',
		focus: 'Watch bone strength, hot flashes, sleep quality, mood changes, and cardiovascular risk markers.',
	},
]

const womenGoalPlans = {
	energy: {
		label: 'Energy and Nutrition',
		tips: ['Check hemoglobin and vitamin D regularly.', 'Include iron-rich meals several times a week.', 'Keep a hydration target of 2 to 2.5 liters daily.'],
	},
	cycle: {
		label: 'Cycle and Hormonal Health',
		tips: ['Track cycle dates and symptoms.', 'Discuss severe pain or heavy bleeding early with a gynecologist.', 'Reduce ultra-processed foods during PMS weeks.'],
	},
	bone: {
		label: 'Bone and Strength',
		tips: ['Do resistance exercise three times each week.', 'Maintain calcium and protein intake daily.', 'Get bone-risk screening when advised.'],
	},
	mental: {
		label: 'Mental and Emotional Wellness',
		tips: ['Schedule 20 minutes of calm time daily.', 'Maintain 7 to 8 hours of sleep.', 'Seek counseling support if mood symptoms stay persistent.'],
	},
}

const tabs = [
	{ id: 'articles', label: 'Articles', icon: DocumentTextIcon },
	{ id: 'videos', label: 'Videos', icon: PlayIcon },
	{ id: 'guides', label: 'Guides', icon: CheckCircleIcon },
	{ id: 'quizzes', label: 'Quizzes', icon: QuestionMarkCircleIcon },
	{ id: 'support', label: 'Government and WHO Support', icon: BuildingLibraryIcon },
	{ id: 'women-health', label: 'Women Health', icon: HeartIcon },
]

function EmptyState({ message }) {
	return (
		<Card>
			<p className="text-sm text-slate-600">{message}</p>
		</Card>
	)
}

export default function HealthEducationHub() {
	const { email } = useAuth()
	const [activeTab, setActiveTab] = useState('articles')
	const [searchTerm, setSearchTerm] = useState('')
	const [selectedCategory, setSelectedCategory] = useState('all')
	const [supportPrograms, setSupportPrograms] = useState([])
	const [womenReminders, setWomenReminders] = useState([])
	const [loadingSupport, setLoadingSupport] = useState(true)
	const [loadingReminders, setLoadingReminders] = useState(true)
	const [selectedWomenStage, setSelectedWomenStage] = useState('reproductive')
	const [selectedWomenGoal, setSelectedWomenGoal] = useState('energy')
	const [reminderForm, setReminderForm] = useState({
		reminderType: 'checkup',
		reminderDate: '',
		notes: '',
	})
	const [editingReminderId, setEditingReminderId] = useState(null)
	const [editingReminderForm, setEditingReminderForm] = useState({
		reminderType: '',
		reminderDate: '',
		notes: '',
	})
	const [currentQuiz, setCurrentQuiz] = useState(null)
	const [quizScore, setQuizScore] = useState(null)
	const [userProgress, setUserProgress] = useState({})

	useEffect(() => {
		async function loadEducationData() {
			try {
				const [programs, reminders] = await Promise.all([
					getHealthEducationSupportPrograms(),
					getWomenHealthReminders(email || undefined),
				])
				setSupportPrograms(programs)
				setWomenReminders(reminders)
			} catch (error) {
				toast.error(error.message || 'Failed to load health education data')
			} finally {
				setLoadingSupport(false)
				setLoadingReminders(false)
			}
		}

		loadEducationData()
	}, [email])

	const normalizedSearch = searchTerm.trim().toLowerCase()

	const filteredArticles = articles.filter(
		(article) =>
			(selectedCategory === 'all' || article.category === selectedCategory) &&
			(normalizedSearch === '' ||
				article.title.toLowerCase().includes(normalizedSearch) ||
				article.summary.toLowerCase().includes(normalizedSearch) ||
				article.tags.some((tag) => tag.toLowerCase().includes(normalizedSearch))),
	)

	const filteredVideos = videos.filter(
		(video) =>
			(selectedCategory === 'all' || video.category === selectedCategory) &&
			(normalizedSearch === '' ||
				video.title.toLowerCase().includes(normalizedSearch) ||
				video.description.toLowerCase().includes(normalizedSearch)),
	)

	const filteredGuides = guides.filter(
		(guide) =>
			(selectedCategory === 'all' || guide.category === selectedCategory) &&
			(normalizedSearch === '' ||
				guide.title.toLowerCase().includes(normalizedSearch) ||
				guide.description.toLowerCase().includes(normalizedSearch)),
	)

	const filteredQuizzes = quizzes.filter(
		(quiz) =>
			(selectedCategory === 'all' || quiz.category === selectedCategory) &&
			(normalizedSearch === '' || quiz.title.toLowerCase().includes(normalizedSearch)),
	)

	const groupedSupportPrograms = useMemo(() => {
		const providerMeta = {
			state: { title: 'State Government', accent: 'bg-emerald-500' },
			central: { title: 'Central Government', accent: 'bg-sky-500' },
			who: { title: 'World Health Organization (WHO)', accent: 'bg-violet-500' },
		}

		return Object.entries(
			supportPrograms.reduce((accumulator, program) => {
				const key = program.providerType || 'state'
				accumulator[key] = accumulator[key] || []
				accumulator[key].push(program)
				return accumulator
			}, {}),
		).map(([providerType, items]) => ({
			id: providerType,
			title: providerMeta[providerType]?.title || providerType,
			accent: providerMeta[providerType]?.accent || 'bg-slate-500',
			coverage: Math.round(items.reduce((sum, item) => sum + (Number(item.coverage) || 0), 0) / Math.max(items.length, 1)),
			items,
		}))
	}, [supportPrograms])

	const selectedStage = womenLifeStages.find((stage) => stage.id === selectedWomenStage) || womenLifeStages[0]
	const selectedGoal = womenGoalPlans[selectedWomenGoal] || womenGoalPlans.energy

	const startQuiz = (quiz) => {
		setCurrentQuiz({ ...quiz, currentQuestion: 0, answers: [], score: 0 })
		setQuizScore(null)
	}

	const answerQuestion = (answerIndex) => {
		const updatedQuiz = { ...currentQuiz }
		updatedQuiz.answers.push(answerIndex)

		if (answerIndex === updatedQuiz.questions[updatedQuiz.currentQuestion].correct) {
			updatedQuiz.score += 1
		}

		if (updatedQuiz.currentQuestion < updatedQuiz.questions.length - 1) {
			updatedQuiz.currentQuestion += 1
			setCurrentQuiz(updatedQuiz)
			return
		}

		const finalScore = Math.round((updatedQuiz.score / updatedQuiz.questions.length) * 100)
		setQuizScore(finalScore)
		setUserProgress((prev) => ({
			...prev,
			[updatedQuiz.id]: { score: finalScore, completedAt: new Date().toISOString() },
		}))
		setCurrentQuiz(null)
		toast.success(`Quiz completed. Score: ${finalScore}%`)
	}

	const scheduleReminder = async () => {
		if (!reminderForm.reminderDate) {
			toast.error('Reminder date is required')
			return
		}

		const savedReminder = await saveWomenHealthReminder({
			language: 'en',
			stage: selectedWomenStage,
			goal: selectedWomenGoal,
			reminderType: reminderForm.reminderType,
			reminderDate: reminderForm.reminderDate,
			notes: reminderForm.notes,
		})

		setWomenReminders((prev) => [savedReminder, ...prev])
		setReminderForm({ reminderType: 'checkup', reminderDate: '', notes: '' })
		toast.success('Women health reminder scheduled successfully')
	}

	const startEditReminder = (reminder) => {
		setEditingReminderId(reminder._id || reminder.id)
		setEditingReminderForm({
			reminderType: reminder.reminderType || 'checkup',
			reminderDate: reminder.reminderDate ? new Date(reminder.reminderDate).toISOString().slice(0, 16) : '',
			notes: reminder.notes || '',
		})
	}

	const cancelEditReminder = () => {
		setEditingReminderId(null)
		setEditingReminderForm({ reminderType: '', reminderDate: '', notes: '' })
	}

	const saveEditedReminder = async (reminder) => {
		if (!editingReminderForm.reminderDate) {
			toast.error('Reminder date is required')
			return
		}

		const updated = await updateWomenHealthReminder(reminder._id || reminder.id, {
			language: reminder.language || 'en',
			stage: reminder.stage,
			goal: reminder.goal,
			reminderType: editingReminderForm.reminderType,
			reminderDate: new Date(editingReminderForm.reminderDate).toISOString(),
			notes: editingReminderForm.notes,
		})

		setWomenReminders((prev) => prev.map((item) => ((item._id || item.id) === (updated._id || updated.id) ? updated : item)))
		cancelEditReminder()
		toast.success('Reminder updated successfully')
	}

	const removeReminder = async (reminderId) => {
		await deleteWomenHealthReminder(reminderId)
		setWomenReminders((prev) => prev.filter((item) => (item._id || item.id) !== reminderId))
		toast.success('Reminder deleted successfully')
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
				<div>
					<h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Health Education Hub</h1>
					<p className="text-sm text-slate-600 dark:text-slate-400">
						Explore health articles, official support programs, and practical care plans in one place.
					</p>
				</div>
				<div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
					<CheckCircleIcon className="h-5 w-5" />
					Updated learning resources
				</div>
			</div>

			<div className="flex flex-col gap-4 sm:flex-row">
				<div className="relative flex-1">
					<MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
					<input
						type="text"
						placeholder="Search articles, videos, guides, and support"
						value={searchTerm}
						onChange={(event) => setSearchTerm(event.target.value)}
						className="w-full rounded-xl border border-slate-300 bg-white px-10 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none"
					/>
				</div>
				<div className="flex gap-2 overflow-x-auto">
					{categories.map((category) => (
						<button
							key={category.id}
							onClick={() => setSelectedCategory(category.id)}
							className={`rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition ${
								selectedCategory === category.id
									? 'bg-brand-100 text-brand-700'
									: 'bg-slate-100 text-slate-700 hover:bg-slate-200'
							}`}
						>
							<span className="mr-2">{category.icon}</span>
							{category.name}
						</button>
					))}
				</div>
			</div>

			<div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
				{tabs.map((tab) => {
					const TabIcon = tab.icon
					return (
						<button
							key={tab.id}
							onClick={() => setActiveTab(tab.id)}
							className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
								activeTab === tab.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
							}`}
						>
							<TabIcon className="h-4 w-4" />
							{tab.label}
						</button>
					)
				})}
			</div>

			{activeTab === 'articles' && (
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{filteredArticles.length === 0 ? <EmptyState message="No articles are available for the selected filter." /> : null}
					{filteredArticles.map((article) => (
						<Card key={article.id} className="hover:shadow-lg transition-shadow">
							<div className="flex items-center justify-between text-sm text-slate-500">
								<span>{article.image}</span>
								<span className="rounded-full bg-slate-100 px-2 py-1 capitalize">{article.category.replace('-', ' ')}</span>
							</div>
							<h3 className="text-base font-semibold text-slate-900">{article.title}</h3>
							<p className="text-sm text-slate-600">{article.summary}</p>
							<div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
								<span className="inline-flex items-center gap-1"><UserIcon className="h-4 w-4" /> {article.author}</span>
								<span className="inline-flex items-center gap-1"><ClockIcon className="h-4 w-4" /> {article.readTime}</span>
								<span className="inline-flex items-center gap-1"><CalendarIcon className="h-4 w-4" /> {new Date(article.publishDate).toLocaleDateString()}</span>
							</div>
							<button className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
								Read Article
							</button>
						</Card>
					))}
				</div>
			)}

			{activeTab === 'videos' && (
				<div className="grid gap-6 md:grid-cols-2">
					{filteredVideos.length === 0 ? <EmptyState message="No videos are available for the selected filter." /> : null}
					{filteredVideos.map((video) => (
						<Card key={video.id} className="hover:shadow-lg transition-shadow">
							<div className="flex h-28 items-center justify-center rounded-lg bg-slate-100 text-4xl">{video.thumbnail}</div>
							<h3 className="text-base font-semibold text-slate-900">{video.title}</h3>
							<p className="text-sm text-slate-600">{video.description}</p>
							<div className="flex flex-wrap gap-3 text-xs text-slate-500">
								<span>{video.author}</span>
								<span>{video.duration}</span>
								<span>{video.views} views</span>
							</div>
							<button className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
								Watch Video
							</button>
						</Card>
					))}
				</div>
			)}

			{activeTab === 'guides' && (
				<div className="grid gap-6 md:grid-cols-2">
					{filteredGuides.length === 0 ? <EmptyState message="No guides are available for the selected filter." /> : null}
					{filteredGuides.map((guide) => (
						<Card key={guide.id} className="hover:shadow-lg transition-shadow">
							<div className="flex items-center gap-2">
								<span className="text-2xl">{guide.icon}</span>
								<h3 className="text-base font-semibold text-slate-900">{guide.title}</h3>
							</div>
							<p className="text-sm text-slate-600">{guide.description}</p>
							<ol className="space-y-1 text-sm text-slate-700">
								{guide.steps.map((step, index) => (
									<li key={`${guide.id}-${index}`} className="flex items-start gap-2">
										<span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold">
											{index + 1}
										</span>
										{step}
									</li>
								))}
							</ol>
						</Card>
					))}
				</div>
			)}

			{activeTab === 'quizzes' && (
				<div className="space-y-4">
					{currentQuiz ? (
						<Card title={`Question ${currentQuiz.currentQuestion + 1} of ${currentQuiz.questions.length}`}>
							<p className="text-base font-semibold text-slate-900">{currentQuiz.questions[currentQuiz.currentQuestion].question}</p>
							<div className="space-y-2">
								{currentQuiz.questions[currentQuiz.currentQuestion].options.map((option, index) => (
									<button
										key={option}
										onClick={() => answerQuestion(index)}
										className="w-full rounded-lg border border-slate-300 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
									>
										{option}
									</button>
								))}
							</div>
						</Card>
					) : quizScore !== null ? (
						<Card title="Quiz Results">
							<p className="text-3xl font-bold text-slate-900">{quizScore}%</p>
							<p className="text-sm text-slate-600">
								{quizScore >= 80 ? 'Excellent understanding.' : quizScore >= 60 ? 'Good progress, keep revising.' : 'Keep practicing and try again.'}
							</p>
							<button
								onClick={() => setQuizScore(null)}
								className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
							>
								Back to Quizzes
							</button>
						</Card>
					) : (
						<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
							{filteredQuizzes.length === 0 ? <EmptyState message="No quizzes are available for the selected filter." /> : null}
							{filteredQuizzes.map((quiz) => (
								<Card key={quiz.id} className="hover:shadow-lg transition-shadow">
									<h3 className="text-base font-semibold text-slate-900">{quiz.title}</h3>
									<p className="text-sm text-slate-600">{quiz.questions.length} questions</p>
									{userProgress[quiz.id] ? (
										<p className="text-xs text-slate-500">Previous score: {userProgress[quiz.id].score}%</p>
									) : null}
									<button
										onClick={() => startQuiz(quiz)}
										className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
									>
										{userProgress[quiz.id] ? 'Retake Quiz' : 'Start Quiz'}
									</button>
								</Card>
							))}
						</div>
					)}
				</div>
			)}

			{activeTab === 'support' && (
				<div className="space-y-6">
					<Card className="border-amber-200 bg-amber-50">
						<h3 className="text-lg font-semibold text-slate-900">Government and WHO Health Support Center</h3>
						<p className="mt-1 text-sm text-slate-700">
							Find financial support programs, application links, and access steps in one place.
						</p>
					</Card>

					<Card title="Support Coverage Overview">
						<div className="space-y-4">
							{loadingSupport ? <p className="text-sm text-slate-500">Loading support programs...</p> : null}
							{groupedSupportPrograms.map((group) => (
								<div key={group.id} className="space-y-1">
									<div className="flex items-center justify-between text-sm">
										<span className="font-medium text-slate-800">{group.title}</span>
										<span className="text-slate-600">{group.coverage}% mapped programs</span>
									</div>
									<div className="h-3 rounded-full bg-slate-200">
										<div className={`h-3 rounded-full ${group.accent}`} style={{ width: `${group.coverage}%` }} />
									</div>
								</div>
							))}
						</div>
					</Card>

					<div className="grid gap-6 lg:grid-cols-3">
						{groupedSupportPrograms.map((group) => (
							<Card key={group.id} className="hover:shadow-lg transition-shadow">
								<div className="space-y-4">
									<div className="flex items-center justify-between">
										<div>
											<p className="text-base font-semibold text-slate-900">{group.title}</p>
											<p className="text-xs text-slate-500">Official support programs</p>
										</div>
										<BuildingLibraryIcon className="h-6 w-6 text-slate-500" />
									</div>

									{group.items.map((program) => (
										<div key={program.id} className="rounded-xl border border-slate-200 p-3">
											<p className="text-sm font-semibold text-slate-900">{program.programName}</p>
											<p className="mt-1 text-xs text-slate-600">{program.support}</p>
											<p className="mt-2 text-xs font-semibold text-slate-700">How to access:</p>
											<ol className="mt-1 space-y-1 text-xs text-slate-600">
												{program.accessSteps.map((step) => (
													<li key={`${program.id}-${step}`} className="flex items-start gap-2">
														<span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400" />
														{step}
													</li>
												))}
											</ol>
											<a
												href={program.link}
												target="_blank"
												rel="noreferrer"
												className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800"
											>
												Open official portal
												<ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
											</a>
										</div>
									))}
								</div>
							</Card>
						))}
						{!loadingSupport && groupedSupportPrograms.length === 0 ? <EmptyState message="No support programs available yet." /> : null}
					</div>
				</div>
			)}

			{activeTab === 'women-health' && (
				<div className="space-y-6">
					<Card className="border-pink-200 bg-pink-50">
						<h3 className="text-lg font-semibold text-slate-900">Personal Women Health Section</h3>
						<p className="mt-1 text-sm text-slate-700">
							Build a stage-based wellness plan and schedule reminders for checkups, medication, and screening tests.
						</p>
					</Card>

					<div className="grid gap-6 xl:grid-cols-[1.4fr,1fr]">
						<Card>
							<div className="grid gap-4 md:grid-cols-2">
								<div>
									<label className="mb-2 block text-sm font-semibold text-slate-800">Select Life Stage</label>
									<select
										value={selectedWomenStage}
										onChange={(event) => setSelectedWomenStage(event.target.value)}
										className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
									>
										{womenLifeStages.map((stage) => (
											<option key={stage.id} value={stage.id}>{stage.label}</option>
										))}
									</select>
								</div>

								<div>
									<label className="mb-2 block text-sm font-semibold text-slate-800">Select Priority Goal</label>
									<select
										value={selectedWomenGoal}
										onChange={(event) => setSelectedWomenGoal(event.target.value)}
										className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
									>
										{Object.entries(womenGoalPlans).map(([goalId, goal]) => (
											<option key={goalId} value={goalId}>{goal.label}</option>
										))}
									</select>
								</div>
							</div>

							<div className="mt-4 rounded-xl border border-pink-200 bg-white p-4">
								<p className="text-sm font-semibold text-slate-900">Stage Focus</p>
								<p className="mt-1 text-sm text-slate-700">{selectedStage.focus}</p>
							</div>

							<div className="rounded-xl border border-slate-200 bg-white p-4">
								<p className="text-sm font-semibold text-slate-900">{selectedGoal.label}</p>
								<ul className="mt-2 space-y-2 text-sm text-slate-700">
									{selectedGoal.tips.map((tip) => (
										<li key={tip} className="flex items-start gap-2">
											<CheckCircleIcon className="mt-0.5 h-4 w-4 text-emerald-600" />
											{tip}
										</li>
									))}
								</ul>
							</div>

							<button
								onClick={() => toast.success('Personal women health plan saved successfully')}
								className="rounded-lg bg-pink-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-700"
							>
								Save My Plan
							</button>
						</Card>

						<Card>
							<div className="flex items-center gap-2 text-slate-900">
								<BellAlertIcon className="h-5 w-5" />
								<h3 className="text-base font-semibold">Women Health Reminders</h3>
							</div>

							<div className="space-y-3">
								<div>
									<label className="mb-2 block text-sm font-semibold text-slate-800">Reminder Type</label>
									<select
										value={reminderForm.reminderType}
										onChange={(event) => setReminderForm((prev) => ({ ...prev, reminderType: event.target.value }))}
										className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
									>
										<option value="checkup">Health Checkup</option>
										<option value="medicine">Medication</option>
										<option value="screening">Screening Test</option>
										<option value="hydration">Hydration and Self-care</option>
									</select>
								</div>

								<div>
									<label className="mb-2 block text-sm font-semibold text-slate-800">Reminder Date</label>
									<input
										type="datetime-local"
										value={reminderForm.reminderDate}
										onChange={(event) => setReminderForm((prev) => ({ ...prev, reminderDate: event.target.value }))}
										className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
									/>
								</div>

								<div>
									<label className="mb-2 block text-sm font-semibold text-slate-800">Additional Notes</label>
									<textarea
										rows={3}
										value={reminderForm.notes}
										onChange={(event) => setReminderForm((prev) => ({ ...prev, notes: event.target.value }))}
										placeholder="Add doctor name, medication, or test note"
										className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
									/>
								</div>

								<button
									onClick={scheduleReminder}
									className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
								>
									Schedule Reminder
								</button>
							</div>

							<div className="space-y-3 border-t border-slate-200 pt-4">
								{loadingReminders ? <p className="text-sm text-slate-500">Loading reminders...</p> : null}
								{!loadingReminders && womenReminders.length === 0 ? <p className="text-sm text-slate-500">No reminders scheduled yet.</p> : null}
								{womenReminders.map((reminder) => (
									<div key={reminder._id || reminder.id} className="rounded-xl border border-slate-200 p-3">
										{editingReminderId === (reminder._id || reminder.id) ? (
											<div className="space-y-2">
												<select
													value={editingReminderForm.reminderType}
													onChange={(event) => setEditingReminderForm((prev) => ({ ...prev, reminderType: event.target.value }))}
													className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
												>
													<option value="checkup">Health Checkup</option>
													<option value="medicine">Medication</option>
													<option value="screening">Screening Test</option>
													<option value="hydration">Hydration and Self-care</option>
												</select>
												<input
													type="datetime-local"
													value={editingReminderForm.reminderDate}
													onChange={(event) => setEditingReminderForm((prev) => ({ ...prev, reminderDate: event.target.value }))}
													className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
												/>
												<textarea
													rows={2}
													value={editingReminderForm.notes}
													onChange={(event) => setEditingReminderForm((prev) => ({ ...prev, notes: event.target.value }))}
													className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
												/>
												<div className="flex gap-2">
													<button
														onClick={() => saveEditedReminder(reminder)}
														className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
													>
														Save
													</button>
													<button
														onClick={cancelEditReminder}
														className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
													>
														Cancel
													</button>
												</div>
											</div>
										) : (
											<>
												<p className="text-sm font-semibold text-slate-900">{reminder.reminderType}</p>
												<p className="text-xs text-slate-500">{new Date(reminder.reminderDate).toLocaleString()}</p>
												<p className="mt-1 text-xs text-slate-600">{reminder.notes || 'No extra notes'}</p>
												<div className="mt-2 flex gap-2">
													<button
														onClick={() => startEditReminder(reminder)}
														className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
													>
														Edit
													</button>
													<button
														onClick={() => removeReminder(reminder._id || reminder.id)}
														className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
													>
														Delete
													</button>
												</div>
											</>
										)}
									</div>
								))}
							</div>
						</Card>
					</div>
				</div>
			)}
		</div>
	)
}
