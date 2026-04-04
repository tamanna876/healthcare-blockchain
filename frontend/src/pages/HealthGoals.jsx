import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import Card from '../components/ui/Card.jsx'
import { toast } from 'react-hot-toast'

export default function HealthGoals() {
  const { email, role } = useAuth()
  const defaultChallenges = [
    {
      id: 1,
      title: '30-Day Walking Challenge',
      description: 'Walk 10,000 steps every day for 30 days',
      participants: 1247,
      duration: 30,
      reward: 'Digital Badge + 500 Health Points',
      joined: false,
      progress: 0,
      category: 'fitness'
    },
    {
      id: 2,
      title: 'Healthy Eating Week',
      description: 'Eat 5 servings of fruits/vegetables daily',
      participants: 892,
      duration: 7,
      reward: 'Nutrition Certificate + 200 Health Points',
      joined: false,
      progress: 0,
      category: 'nutrition'
    },
    {
      id: 3,
      title: 'Sleep Better Challenge',
      description: 'Get 8 hours of sleep for 14 consecutive nights',
      participants: 654,
      duration: 14,
      reward: 'Sleep Master Badge + 300 Health Points',
      joined: false,
      progress: 0,
      category: 'wellness'
    }
  ]
  const [goals, setGoals] = useState(() => {
    const savedGoals = localStorage.getItem(`healthGoals_${email}`)
    return savedGoals ? JSON.parse(savedGoals) : []
  })
  const [challenges, setChallenges] = useState(() => {
    const savedChallenges = localStorage.getItem(`healthChallenges_${email}`)
    return savedChallenges ? JSON.parse(savedChallenges) : defaultChallenges
  })
  const [activeTab, setActiveTab] = useState('goals')
  const [goalForm, setGoalForm] = useState({
    title: '',
    description: '',
    targetValue: '',
    currentValue: 0,
    unit: 'steps',
    deadline: '',
    category: 'fitness'
  })

  useEffect(() => {
    localStorage.setItem(`healthGoals_${email}`, JSON.stringify(goals))
  }, [email, goals])

  useEffect(() => {
    localStorage.setItem(`healthChallenges_${email}`, JSON.stringify(challenges))
  }, [email, challenges])

  const saveGoals = (newGoals) => {
    setGoals(newGoals)
    localStorage.setItem(`healthGoals_${email}`, JSON.stringify(newGoals))
  }

  const saveChallenges = (newChallenges) => {
    setChallenges(newChallenges)
    localStorage.setItem(`healthChallenges_${email}`, JSON.stringify(newChallenges))
  }

  const handleAddGoal = (event) => {
    event.preventDefault()
    if (!goalForm.title || !goalForm.targetValue) {
      toast.error('Please fill in goal title and target value.')
      return
    }

    const newGoal = {
      id: Date.now(),
      ...goalForm,
      createdAt: new Date().toISOString(),
      completed: false
    }

    const updatedGoals = [...goals, newGoal]
    saveGoals(updatedGoals)

    setGoalForm({
      title: '',
      description: '',
      targetValue: '',
      currentValue: 0,
      unit: 'steps',
      deadline: '',
      category: 'fitness'
    })

    toast.success('Health goal added successfully!')
  }

  const updateGoalProgress = (goalId, newProgress) => {
    const updatedGoals = goals.map(goal => {
      if (goal.id === goalId) {
        const updatedGoal = { ...goal, currentValue: newProgress }
        if (newProgress >= goal.targetValue && !goal.completed) {
          updatedGoal.completed = true
          updatedGoal.completedAt = new Date().toISOString()
          toast.success(`🎉 Goal completed: ${goal.title}!`)
        }
        return updatedGoal
      }
      return goal
    })
    saveGoals(updatedGoals)
  }

  const deleteGoal = (goalId) => {
    const updatedGoals = goals.filter(goal => goal.id !== goalId)
    saveGoals(updatedGoals)
    toast.success('Goal deleted')
  }

  const joinChallenge = (challengeId) => {
    const updatedChallenges = challenges.map(challenge => {
      if (challenge.id === challengeId) {
        return { ...challenge, joined: true, joinedAt: new Date().toISOString() }
      }
      return challenge
    })
    saveChallenges(updatedChallenges)
    toast.success('Joined challenge successfully!')
  }

  const updateChallengeProgress = (challengeId, progress) => {
    const updatedChallenges = challenges.map(challenge => {
      if (challenge.id === challengeId) {
        const updatedChallenge = { ...challenge, progress }
        if (progress >= challenge.duration && !challenge.completed) {
          updatedChallenge.completed = true
          updatedChallenge.completedAt = new Date().toISOString()
          toast.success(`🏆 Challenge completed: ${challenge.title}!`)
        }
        return updatedChallenge
      }
      return challenge
    })
    saveChallenges(updatedChallenges)
  }

  if (role !== 'Patient') {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center justify-center gap-4 py-20 text-center">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Access denied</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Health Goals & Challenges are only available to Patient users.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Health Goals & Challenges</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Set objectives, track progress, and join community challenges.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-green-600 dark:text-green-400">Stay Motivated</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        {[
          { id: 'goals', label: 'My Goals', icon: '🎯' },
          { id: 'challenges', label: 'Community Challenges', icon: '🏆' },
          { id: 'achievements', label: 'Achievements', icon: '🏅' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* My Goals Tab */}
        {activeTab === 'goals' && (
          <div className="space-y-6">
            {/* Add New Goal Form */}
            <Card title="Set a New Health Goal" description="Create personalized health objectives to work towards.">
              <form className="space-y-4" onSubmit={handleAddGoal}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Goal Title</span>
                    <input
                      value={goalForm.title}
                      onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
                      placeholder="e.g. Walk 10,000 steps daily"
                      className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Category</span>
                    <select
                      value={goalForm.category}
                      onChange={(e) => setGoalForm({ ...goalForm, category: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
                    >
                      <option value="fitness">Fitness</option>
                      <option value="nutrition">Nutrition</option>
                      <option value="weight">Weight Management</option>
                      <option value="sleep">Sleep</option>
                      <option value="mental">Mental Health</option>
                      <option value="medical">Medical</option>
                    </select>
                  </label>
                </div>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Description (Optional)</span>
                  <textarea
                    value={goalForm.description}
                    onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })}
                    placeholder="Describe your goal in more detail..."
                    rows={2}
                    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Target Value</span>
                    <input
                      type="number"
                      value={goalForm.targetValue}
                      onChange={(e) => setGoalForm({ ...goalForm, targetValue: e.target.value })}
                      placeholder="10000"
                      className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Unit</span>
                    <select
                      value={goalForm.unit}
                      onChange={(e) => setGoalForm({ ...goalForm, unit: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
                    >
                      <option value="steps">Steps</option>
                      <option value="minutes">Minutes</option>
                      <option value="hours">Hours</option>
                      <option value="kg">Kilograms</option>
                      <option value="lbs">Pounds</option>
                      <option value="days">Days</option>
                      <option value="times">Times</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Deadline (Optional)</span>
                    <input
                      type="date"
                      value={goalForm.deadline}
                      onChange={(e) => setGoalForm({ ...goalForm, deadline: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 text-sm font-semibold shadow-md transition-colors"
                >
                  ➕ Create Goal
                </button>
              </form>
            </Card>

            {/* Existing Goals */}
            <Card title="Your Health Goals" description="Track progress on your personal health objectives.">
              {goals.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🎯</div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">No goals set yet.</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Create your first goal above to get started!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {goals.map((goal) => {
                    const progress = Math.min((goal.currentValue / goal.targetValue) * 100, 100)
                    return (
                      <div key={goal.id} className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-slate-900 dark:text-slate-100">{goal.title}</h4>
                              {goal.completed && (
                                <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full">
                                  ✓ Completed
                                </span>
                              )}
                            </div>
                            {goal.description && (
                              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{goal.description}</p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                              <span>{goal.category}</span>
                              {goal.deadline && <span>Due: {new Date(goal.deadline).toLocaleDateString()}</span>}
                            </div>
                          </div>
                          <button
                            onClick={() => deleteGoal(goal.id)}
                            className="text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                          >
                            🗑️
                          </button>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-600 dark:text-slate-400">
                              {goal.currentValue} / {goal.targetValue} {goal.unit}
                            </span>
                            <span className="text-slate-600 dark:text-slate-400">{Math.round(progress)}%</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                goal.completed ? 'bg-green-500' : 'bg-brand-500'
                              }`}
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Progress Update */}
                        {!goal.completed && (
                          <div className="flex gap-2">
                            <input
                              type="number"
                              placeholder="Update progress"
                              className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  const value = parseFloat(e.target.value)
                                  if (!isNaN(value)) {
                                    updateGoalProgress(goal.id, value)
                                    e.target.value = ''
                                  }
                                }
                              }}
                            />
                            <button
                              onClick={(e) => {
                                const input = e.target.previousElementSibling
                                const value = parseFloat(input.value)
                                if (!isNaN(value)) {
                                  updateGoalProgress(goal.id, value)
                                  input.value = ''
                                }
                              }}
                              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm rounded-lg transition-colors"
                            >
                              Update
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Community Challenges Tab */}
        {activeTab === 'challenges' && (
          <Card title="Community Health Challenges" description="Join community challenges to stay motivated and earn rewards.">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {challenges.map((challenge) => (
                <div key={challenge.id} className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100">{challenge.title}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      challenge.joined
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}>
                      {challenge.joined ? 'Joined' : 'Available'}
                    </span>
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{challenge.description}</p>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Duration:</span>
                      <span className="text-slate-900 dark:text-slate-100">{challenge.duration} days</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Participants:</span>
                      <span className="text-slate-900 dark:text-slate-100">{challenge.participants.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Reward:</span>
                      <span className="text-green-600 dark:text-green-400 text-xs">{challenge.reward}</span>
                    </div>
                  </div>

                  {challenge.joined && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-600 dark:text-slate-400">Progress</span>
                        <span className="text-slate-600 dark:text-slate-400">{challenge.progress}/{challenge.duration} days</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(challenge.progress / challenge.duration) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      if (!challenge.joined) {
                        joinChallenge(challenge.id)
                      } else {
                        // Update progress (simplified - in real app this would be automatic)
                        const newProgress = Math.min(challenge.progress + 1, challenge.duration)
                        updateChallengeProgress(challenge.id, newProgress)
                      }
                    }}
                    className={`w-full py-2 px-4 text-sm font-semibold rounded-lg transition-colors ${
                      challenge.joined
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-brand-600 hover:bg-brand-700 text-white'
                    }`}
                  >
                    {challenge.joined ? 'Update Progress' : 'Join Challenge'}
                  </button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <Card title="Your Achievements" description="Celebrate your health milestones and earned rewards.">
            <div className="space-y-6">
              {/* Completed Goals */}
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Completed Goals</h4>
                {goals.filter(goal => goal.completed).length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No completed goals yet. Keep working towards your objectives!</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {goals.filter(goal => goal.completed).map((goal) => (
                      <div key={goal.id} className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🏆</span>
                          <div>
                            <p className="font-medium text-green-900 dark:text-green-100">{goal.title}</p>
                            <p className="text-sm text-green-700 dark:text-green-300">
                              Completed {new Date(goal.completedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Completed Challenges */}
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Completed Challenges</h4>
                {challenges.filter(challenge => challenge.completed).length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No completed challenges yet. Join a challenge to get started!</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {challenges.filter(challenge => challenge.completed).map((challenge) => (
                      <div key={challenge.id} className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🏅</span>
                          <div>
                            <p className="font-medium text-blue-900 dark:text-blue-100">{challenge.title}</p>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                              Completed {new Date(challenge.completedAt).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-400">{challenge.reward}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg text-center">
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{goals.filter(g => g.completed).length}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Goals Completed</div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg text-center">
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{challenges.filter(c => c.completed).length}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Challenges Won</div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg text-center">
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {goals.filter(g => g.completed).length + challenges.filter(c => c.completed).length * 100}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Health Points</div>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}