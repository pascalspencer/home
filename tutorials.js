// Tutorials Page JavaScript
class TutorialManager {
    constructor() {
        this.courses = [
            {
                id: 'deriv-basics',
                title: 'Introduction to Deriv Trading',
                description: 'Learn the fundamentals of deriv trading, understand different markets, and master basic trading concepts.',
                level: 'Beginner',
                lessons: 12,
                duration: '2 hours',
                progress: 0,
                icon: 'fas fa-graduation-cap',
                color: 'blue',
                topics: [
                    'What are Derivatives?',
                    'Types of Deriv Markets',
                    'Understanding Volatility',
                    'Basic Trading Terminology',
                    'How to Read Charts',
                    'Placing Your First Trade',
                    'Order Types Explained',
                    'Market vs Limit Orders',
                    'Trading Hours and Sessions',
                    'Basic Risk Management',
                    'Demo Trading Practice',
                    'Moving to Live Trading'
                ]
            },
            {
                id: 'technical-analysis',
                title: 'Technical Analysis Mastery',
                description: 'Master chart patterns, indicators, and technical analysis tools for better trading decisions.',
                level: 'Intermediate',
                lessons: 18,
                duration: '4 hours',
                progress: 0,
                icon: 'fas fa-chart-area',
                color: 'green',
                topics: [
                    'Introduction to Technical Analysis',
                    'Support and Resistance Levels',
                    'Trend Analysis',
                    'Chart Patterns (Triangles, Flags)',
                    'Candlestick Patterns',
                    'Moving Averages',
                    'RSI (Relative Strength Index)',
                    'MACD (Moving Average Convergence Divergence)',
                    'Bollinger Bands',
                    'Stochastic Oscillator',
                    'Volume Analysis',
                    'Multiple Time Frame Analysis',
                    'Fibonacci Retracements',
                    'Ichimoku Cloud',
                    'Divergence Trading',
                    'Breakout Strategies',
                    'Reversal Patterns',
                    'Putting It All Together'
                ]
            },
            {
                id: 'risk-management',
                title: 'Risk Management Essentials',
                description: 'Learn essential risk management techniques to protect your capital and maximize profits.',
                level: 'Beginner',
                lessons: 8,
                duration: '1.5 hours',
                progress: 0,
                icon: 'fas fa-shield-alt',
                color: 'red',
                topics: [
                    'Understanding Risk in Trading',
                    'Position Sizing Basics',
                    'The 2% Rule',
                    'Setting Stop Losses',
                    'Take Profit Strategies',
                    'Risk-Reward Ratios',
                    'Portfolio Diversification',
                    'Emotional Risk Management'
                ]
            },
            {
                id: 'bot-building',
                title: 'Automated Trading Bots',
                description: 'Build and deploy automated trading strategies using our visual bot builder.',
                level: 'Advanced',
                lessons: 15,
                duration: '5 hours',
                progress: 0,
                icon: 'fas fa-robot',
                color: 'purple',
                topics: [
                    'Introduction to Algorithmic Trading',
                    'Bot Builder Overview',
                    'Creating Your First Strategy',
                    'Technical Indicators in Bots',
                    'Conditional Logic',
                    'Risk Management in Bots',
                    'Backtesting Strategies',
                    'Optimizing Parameters',
                    'Paper Trading',
                    'Live Deployment',
                    'Monitoring Performance',
                    'Strategy Maintenance',
                    'Advanced Bot Features',
                    'Multi-Strategy Bots',
                    'Professional Bot Development'
                ]
            },
            {
                id: 'trading-psychology',
                title: 'Trading Psychology',
                description: 'Master the mental aspects of trading and develop emotional discipline.',
                level: 'Intermediate',
                lessons: 10,
                duration: '2.5 hours',
                progress: 0,
                icon: 'fas fa-brain',
                color: 'yellow',
                topics: [
                    'The Psychology of Trading',
                    'Common Trading Biases',
                    'Fear and Greed Management',
                    'Developing Trading Discipline',
                    'Handling Losses',
                    'Maintaining Confidence',
                    'Stress Management',
                    'Decision Making Under Pressure',
                    'Building a Trading Plan',
                    'Continuous Improvement'
                ]
            },
            {
                id: 'advanced-strategies',
                title: 'Advanced Strategies',
                description: 'Explore complex trading strategies used by professional traders.',
                level: 'Advanced',
                lessons: 20,
                duration: '6 hours',
                progress: 0,
                icon: 'fas fa-chess',
                color: 'indigo',
                topics: [
                    'Advanced Deriv Strategies',
                    'Synthetic Indices Trading',
                    'Crash/Boom Strategies',
                    'Volatility Trading',
                    'Scalping Techniques',
                    'Swing Trading Methods',
                    'Position Trading',
                    'Hedging Strategies',
                    'Arbitrage Opportunities',
                    'News Trading',
                    'Seasonal Patterns',
                    'Market Making Concepts',
                    'High-Frequency Trading',
                    'Portfolio Hedging',
                    'Cross-Market Analysis',
                    'Advanced Risk Management',
                    'Performance Metrics',
                    'Strategy Optimization',
                    'Professional Trading Tools',
                    'Building a Trading Business'
                ]
            }
        ];
        
        this.currentCourse = null;
        this.currentLesson = 0;
        this.userProgress = this.loadProgress();
        
        this.init();
    }

    init() {
        this.renderCourses();
        this.setupEventListeners();
        this.updateProgressDisplay();
    }

    loadProgress() {
        const saved = localStorage.getItem('tutorialProgress');
        return saved ? JSON.parse(saved) : {};
    }

    saveProgress() {
        localStorage.setItem('tutorialProgress', JSON.stringify(this.userProgress));
    }

    renderCourses() {
        const courseContainer = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3');
        if (!courseContainer) return;

        // Update course progress from user data
        this.courses.forEach(course => {
            const courseProgress = this.userProgress[course.id];
            if (courseProgress) {
                course.progress = courseProgress.progress || 0;
            }
        });
    }

    startCourse(courseId) {
        this.currentCourse = this.courses.find(course => course.id === courseId);
        if (!this.currentCourse) return;

        this.currentLesson = this.userProgress[courseId]?.currentLesson || 0;
        this.showCourseInterface();
    }

    showCourseInterface() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        
        modal.innerHTML = `
            <div class="bg-white rounded-xl max-w-4xl w-full max-h-full overflow-hidden">
                <!-- Course Header -->
                <div class="bg-gradient-to-r from-primary to-secondary text-white p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="text-2xl font-bold">${this.currentCourse.title}</h2>
                        <button class="text-white hover:text-gray-200" onclick="this.closest('.fixed').remove()">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                    <div class="flex items-center space-x-4 text-sm">
                        <span class="bg-white bg-opacity-20 px-3 py-1 rounded-full">${this.currentCourse.level}</span>
                        <span>${this.currentCourse.lessons} lessons</span>
                        <span>${this.currentCourse.duration}</span>
                    </div>
                </div>

                <!-- Course Content -->
                <div class="flex h-96">
                    <!-- Lesson Sidebar -->
                    <div class="w-80 bg-gray-50 border-r border-gray-200 overflow-y-auto">
                        <div class="p-4">
                            <h3 class="font-semibold text-gray-900 mb-4">Course Content</h3>
                            <div class="space-y-2">
                                ${this.currentCourse.topics.map((topic, index) => `
                                    <div class="lesson-item p-3 rounded-lg cursor-pointer transition-colors ${
                                        index === this.currentLesson ? 'bg-blue-100 border border-blue-300' : 
                                        index < this.getCourseProgress(this.currentCourse.id) ? 'bg-green-100 border border-green-300' : 
                                        'bg-white border border-gray-200 hover:bg-gray-50'
                                    }" data-lesson="${index}">
                                        <div class="flex items-center space-x-3">
                                            <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                                index === this.currentLesson ? 'bg-blue-500 text-white' :
                                                index < this.getCourseProgress(this.currentCourse.id) ? 'bg-green-500 text-white' :
                                                'bg-gray-300 text-gray-600'
                                            }">
                                                ${index + 1}
                                            </div>
                                            <div class="flex-1">
                                                <div class="text-sm font-medium text-gray-900">${topic}</div>
                                                <div class="text-xs text-gray-500">${index < this.getCourseProgress(this.currentCourse.id) ? 'Completed' : 'Not started'}</div>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>

                    <!-- Lesson Content -->
                    <div class="flex-1 p-6 overflow-y-auto">
                        <div id="lessonContent">
                            ${this.renderLessonContent()}
                        </div>
                    </div>
                </div>

                <!-- Course Footer -->
                <div class="border-t border-gray-200 p-4 bg-gray-50">
                    <div class="flex items-center justify-between">
                        <button id="prevLesson" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors ${this.currentLesson === 0 ? 'opacity-50 cursor-not-allowed' : ''}" 
                                ${this.currentLesson === 0 ? 'disabled' : ''}>
                            <i class="fas fa-arrow-left mr-2"></i>Previous
                        </button>
                        
                        <div class="flex items-center space-x-4">
                            <span class="text-sm text-gray-600">Lesson ${this.currentLesson + 1} of ${this.currentCourse.lessons}</span>
                            <div class="w-32 bg-gray-200 rounded-full h-2">
                                <div class="tutorial-progress h-2 rounded-full" style="width: ${(this.currentLesson / this.currentCourse.topics.length) * 100}%"></div>
                            </div>
                        </div>
                        
                        <button id="nextLesson" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary transition-colors">
                            ${this.currentLesson === this.currentCourse.topics.length - 1 ? 'Complete Course' : 'Next Lesson'}
                            <i class="fas fa-arrow-right ml-2"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.setupCourseEvents(modal);
    }

    renderLessonContent() {
        const lessonData = this.generateLessonContent(this.currentCourse.id, this.currentLesson);
        
        return `
            <div class="space-y-6">
                <div>
                    <h3 class="text-xl font-bold text-gray-900 mb-4">${lessonData.title}</h3>
                    <div class="prose max-w-none">
                        ${lessonData.content}
                    </div>
                </div>
                
                ${lessonData.example ? `
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 class="font-semibold text-blue-900 mb-2">
                            <i class="fas fa-lightbulb mr-2"></i>Example
                        </h4>
                        <p class="text-blue-800">${lessonData.example}</p>
                    </div>
                ` : ''}
                
                ${lessonData.quiz ? `
                    <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h4 class="font-semibold text-gray-900 mb-4">
                            <i class="fas fa-question-circle mr-2"></i>Quick Quiz
                        </h4>
                        <div class="space-y-3">
                            <p class="font-medium text-gray-900">${lessonData.quiz.question}</p>
                            <div class="space-y-2">
                                ${lessonData.quiz.options.map((option, index) => `
                                    <label class="flex items-center space-x-3 cursor-pointer">
                                        <input type="radio" name="quiz" value="${index}" class="text-primary">
                                        <span class="text-gray-700">${option}</span>
                                    </label>
                                `).join('')}
                            </div>
                            <button class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary transition-colors" onclick="tutorialManager.checkQuizAnswer()">
                                Submit Answer
                            </button>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    generateLessonContent(courseId, lessonIndex) {
        const lessonContents = {
            'deriv-basics': [
                {
                    title: 'What are Derivatives?',
                    content: `
                        <p>Derivatives are financial instruments whose value is derived from an underlying asset. In Deriv trading, you'll encounter several types of synthetic instruments that simulate real market conditions.</p>
                        <p>Key characteristics of derivatives include:</p>
                        <ul>
                            <li>They don't represent ownership of the underlying asset</li>
                            <li>Their prices move based on the underlying market</li>
                            <li>They allow for various trading strategies</li>
                            <li>They operate 24/7 without market closures</li>
                        </ul>
                    `,
                    example: 'Think of derivatives like a mirror reflection of real markets - they move the same way but exist independently.'
                },
                {
                    title: 'Types of Deriv Markets',
                    content: `
                        <p>Deriv offers several types of synthetic markets, each with unique characteristics:</p>
                        <h4>Volatility Indices</h4>
                        <p>These simulate markets with constant volatility levels, ranging from Volatility 10 (low) to Volatility 100 (high).</p>
                        <h4>Crash/Boom Indices</h4>
                        <p>These simulate sudden market movements with average crash/boom frequencies.</p>
                        <h4>Step Indices</h4>
                        <p>These move in discrete steps rather than continuous price movements.</p>
                    `,
                    quiz: {
                        question: 'Which type of synthetic index has the lowest volatility?',
                        options: ['Volatility 10', 'Volatility 75', 'Crash 1000', 'Boom 500'],
                        correct: 0
                    }
                }
            ],
            'technical-analysis': [
                {
                    title: 'Introduction to Technical Analysis',
                    content: `
                        <p>Technical analysis is the study of price movements and patterns to predict future market behavior. It's based on the idea that historical price data can help forecast future movements.</p>
                        <h4>Key Principles:</h4>
                        <ul>
                            <li>Price discounts everything</li>
                            <li>Prices move in trends</li>
                            <li>History tends to repeat itself</li>
                        </ul>
                    `,
                    example: 'Like reading weather patterns - past conditions help predict future weather, though not perfectly.'
                },
                {
                    title: 'Support and Resistance Levels',
                    content: `
                        <p>Support and resistance are key concepts in technical analysis that help identify potential price reversal points.</p>
                        <h4>Support Levels</h4>
                        <p>Price levels where buying interest is strong enough to overcome selling pressure, causing prices to bounce upward.</p>
                        <h4>Resistance Levels</h4>
                        <p>Price levels where selling pressure is strong enough to overcome buying interest, causing prices to reverse downward.</p>
                    `,
                    quiz: {
                        question: 'What happens when price reaches a support level?',
                        options: ['Price always breaks through', 'Price usually bounces upward', 'Price becomes stagnant', 'Price reverses trend completely'],
                        correct: 1
                    }
                }
            ]
        };

        // Default content for courses not explicitly defined
        const defaultContent = {
            title: `Lesson ${lessonIndex + 1}`,
            content: `
                <p>This lesson covers important concepts in ${this.currentCourse.title}.</p>
                <p>Key topics include:</p>
                <ul>
                    <li>Understanding the fundamentals</li>
                    <li>Practical applications</li>
                    <li>Risk considerations</li>
                    <li>Best practices</li>
                </ul>
                <p>Take your time to understand these concepts before moving to the next lesson.</p>
            `,
            example: 'Practice these concepts in a demo account before applying them to live trading.'
        };

        const courseContent = lessonContents[courseId];
        if (courseContent && courseContent[lessonIndex]) {
            return courseContent[lessonIndex];
        }
        
        return defaultContent;
    }

    setupCourseEvents(modal) {
        const prevButton = modal.querySelector('#prevLesson');
        const nextButton = modal.querySelector('#nextLesson');
        const lessonItems = modal.querySelectorAll('.lesson-item');

        prevButton.addEventListener('click', () => {
            if (this.currentLesson > 0) {
                this.currentLesson--;
                this.updateLessonContent(modal);
            }
        });

        nextButton.addEventListener('click', () => {
            this.markLessonComplete();
            
            if (this.currentLesson < this.currentCourse.topics.length - 1) {
                this.currentLesson++;
                this.updateLessonContent(modal);
            } else {
                this.completeCourse();
                modal.remove();
            }
        });

        lessonItems.forEach((item, index) => {
            item.addEventListener('click', () => {
                if (index <= this.getCourseProgress(this.currentCourse.id)) {
                    this.currentLesson = index;
                    this.updateLessonContent(modal);
                }
            });
        });
    }

    updateLessonContent(modal) {
        const lessonContent = modal.querySelector('#lessonContent');
        const prevButton = modal.querySelector('#prevLesson');
        const nextButton = modal.querySelector('#nextLesson');
        const progressBar = modal.querySelector('.tutorial-progress');
        const lessonItems = modal.querySelectorAll('.lesson-item');

        // Update content
        lessonContent.innerHTML = this.renderLessonContent();

        // Update navigation buttons
        prevButton.disabled = this.currentLesson === 0;
        prevButton.className = `px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors ${
            this.currentLesson === 0 ? 'opacity-50 cursor-not-allowed' : ''
        }`;

        nextButton.innerHTML = this.currentLesson === this.currentCourse.topics.length - 1 
            ? 'Complete Course <i class="fas fa-check ml-2"></i>'
            : 'Next Lesson <i class="fas fa-arrow-right ml-2"></i>';

        // Update progress bar
        const progress = ((this.currentLesson + 1) / this.currentCourse.topics.length) * 100;
        progressBar.style.width = `${progress}%`;

        // Update lesson items
        lessonItems.forEach((item, index) => {
            const isCompleted = index < this.getCourseProgress(this.currentCourse.id);
            const isCurrent = index === this.currentLesson;
            const isAccessible = index <= this.getCourseProgress(this.currentCourse.id);

            item.className = `lesson-item p-3 rounded-lg cursor-pointer transition-colors ${
                isCurrent ? 'bg-blue-100 border border-blue-300' :
                isCompleted ? 'bg-green-100 border border-green-300' :
                'bg-white border border-gray-200 hover:bg-gray-50'
            }`;

            const numberDiv = item.querySelector('.w-8.h-8');
            numberDiv.className = `w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                isCurrent ? 'bg-blue-500 text-white' :
                isCompleted ? 'bg-green-500 text-white' :
                'bg-gray-300 text-gray-600'
            }`;

            const statusDiv = item.querySelector('.text-xs.text-gray-500');
            statusDiv.textContent = isCompleted ? 'Completed' : isCurrent ? 'In progress' : 'Not started';
        });

        // Save progress
        this.saveCourseProgress();
    }

    markLessonComplete() {
        if (!this.userProgress[this.currentCourse.id]) {
            this.userProgress[this.currentCourse.id] = {
                progress: 0,
                currentLesson: 0,
                completedLessons: []
            };
        }

        const progress = this.userProgress[this.currentCourse.id];
        if (!progress.completedLessons.includes(this.currentLesson)) {
            progress.completedLessons.push(this.currentLesson);
            progress.progress = progress.completedLessons.length;
            progress.currentLesson = this.currentLesson + 1;
        }

        this.saveProgress();
        this.updateProgressDisplay();
    }

    completeCourse() {
        if (!this.userProgress[this.currentCourse.id]) {
            this.userProgress[this.currentCourse.id] = {
                progress: 0,
                currentLesson: 0,
                completedLessons: []
            };
        }

        this.userProgress[this.currentCourse.id].progress = this.currentCourse.topics.length;
        this.userProgress[this.currentCourse.id].completed = true;
        this.userProgress[this.currentCourse.id].completedDate = new Date().toISOString();

        this.saveProgress();
        this.updateProgressDisplay();

        this.showNotification(`Congratulations! You've completed the ${this.currentCourse.title} course!`, 'success');
    }

    getCourseProgress(courseId) {
        return this.userProgress[courseId]?.progress || 0;
    }

    saveCourseProgress() {
        if (!this.userProgress[this.currentCourse.id]) {
            this.userProgress[this.currentCourse.id] = {
                progress: 0,
                currentLesson: 0,
                completedLessons: []
            };
        }

        this.userProgress[this.currentCourse.id].currentLesson = this.currentLesson;
        this.saveProgress();
    }

    updateProgressDisplay() {
        // Update progress bars in course cards
        const courseCards = document.querySelectorAll('.card-hover');
        courseCards.forEach((card, index) => {
            const course = this.courses[index];
            if (course) {
                const progressBar = card.querySelector('.tutorial-progress');
                const progressText = card.querySelector('.flex.items-center.justify-between.text-sm.mb-1 .text-gray-600:last-child');
                
                if (progressBar && progressText) {
                    const progress = this.getCourseProgress(course.id);
                    const percentage = (progress / course.topics.length) * 100;
                    
                    progressBar.style.width = `${percentage}%`;
                    progressText.textContent = `${progress}/${course.topics.length}`;
                }
            }
        });

        // Update overall statistics
        const completedCourses = Object.values(this.userProgress).filter(p => p.completed).length;
        const totalLessons = Object.values(this.userProgress).reduce((sum, p) => sum + (p.progress || 0), 0);
        const completedQuizzes = Object.values(this.userProgress).reduce((sum, p) => sum + (p.quizzesPassed || 0), 0);

        // Update stats in the progress section
        const statNumbers = document.querySelectorAll('.w-24.h-24 .text-white');
        if (statNumbers.length >= 3) {
            statNumbers[0].textContent = completedCourses;
            statNumbers[1].textContent = totalLessons;
            statNumbers[2].textContent = completedQuizzes;
        }
    }

    checkQuizAnswer() {
        const selectedAnswer = document.querySelector('input[name="quiz"]:checked');
        if (!selectedAnswer) {
            this.showNotification('Please select an answer first!', 'error');
            return;
        }

        const lessonData = this.generateLessonContent(this.currentCourse.id, this.currentLesson);
        const correct = parseInt(selectedAnswer.value) === lessonData.quiz.correct;

        if (correct) {
            this.showNotification('Correct! Well done!', 'success');
            
            // Update quiz progress
            if (!this.userProgress[this.currentCourse.id]) {
                this.userProgress[this.currentCourse.id] = {};
            }
            if (!this.userProgress[this.currentCourse.id].quizzesPassed) {
                this.userProgress[this.currentCourse.id].quizzesPassed = 0;
            }
            this.userProgress[this.currentCourse.id].quizzesPassed++;
            this.saveProgress();
            this.updateProgressDisplay();
        } else {
            this.showNotification('Incorrect. Try again!', 'error');
        }
    }

    setupEventListeners() {
        // Course start buttons
        document.addEventListener('click', (e) => {
            if (e.target.textContent === 'Start Course' || e.target.textContent === 'Continue Learning' || e.target.textContent === 'Start Learning' || e.target.textContent === 'Master Trading') {
                e.preventDefault();
                
                // Determine which course to start based on context
                const courseCard = e.target.closest('.card-hover');
                if (courseCard) {
                    const courseIndex = Array.from(courseCard.parentNode.children).indexOf(courseCard);
                    if (this.courses[courseIndex]) {
                        this.startCourse(this.courses[courseIndex].id);
                    }
                }
            }
        });

        // Learning path buttons
        const pathButtons = document.querySelectorAll('button[class*="bg-green-500"], button[class*="bg-blue-500"], button[class*="bg-purple-500"]');
        pathButtons.forEach((button, index) => {
            button.addEventListener('click', () => {
                const courseIndex = index * 2; // Rough mapping to courses
                if (this.courses[courseIndex]) {
                    this.startCourse(this.courses[courseIndex].id);
                }
            });
        });
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
        
        notification.className = `fixed top-20 right-4 ${bgColor} text-white px-4 py-2 rounded-lg shadow-lg z-50`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize tutorial manager when page loads
document.addEventListener('DOMContentLoaded', () => {
    new TutorialManager();
});