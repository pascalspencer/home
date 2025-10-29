// Strategies Page JavaScript
class StrategiesPage {
    constructor() {
        this.strategies = [
            {
                id: 'rsi-strategy',
                name: 'RSI Strategy',
                type: 'Momentum Trading',
                winRate: 68,
                bestMarket: 'Volatility 75',
                timeframe: '15 minutes',
                level: 'Beginner',
                category: ['beginner', 'swing'],
                description: 'Uses RSI indicator to identify overbought (>70) and oversold (<30) conditions for contrarian trading opportunities.',
                performance: this.generatePerformanceData(68, 30)
            },
            {
                id: 'macd-strategy',
                name: 'MACD Crossover',
                type: 'Trend Following',
                winRate: 72,
                bestMarket: 'Volatility 100',
                timeframe: '1 hour',
                level: 'Intermediate',
                category: ['swing', 'algorithmic'],
                description: 'Detects trend changes using MACD line crossovers. Buy when MACD line crosses above signal line, sell when it crosses below.',
                performance: this.generatePerformanceData(72, 30)
            },
            {
                id: 'bollinger-strategy',
                name: 'Bollinger Bands',
                type: 'Volatility Trading',
                winRate: 65,
                bestMarket: 'Volatility 50',
                timeframe: '30 minutes',
                level: 'Beginner',
                category: ['beginner', 'swing'],
                description: 'Trades price bounces off Bollinger Bands. Buy when price touches lower band with confirmation, sell when it touches upper band.',
                performance: this.generatePerformanceData(65, 30)
            },
            {
                id: 'scalping-strategy',
                name: '1-Minute Scalping',
                type: 'High-Frequency Trading',
                winRate: 58,
                bestMarket: 'Volatility 25',
                timeframe: '1 minute',
                level: 'Advanced',
                category: ['scalping', 'algorithmic'],
                description: 'Fast-paced scalping strategy using 1-minute charts. Focuses on small, frequent profits with tight stop losses.',
                performance: this.generatePerformanceData(58, 30)
            },
            {
                id: 'breakout-strategy',
                name: 'Breakout Trading',
                type: 'Momentum Strategy',
                winRate: 71,
                bestMarket: 'Crash 1000',
                timeframe: '5 minutes',
                level: 'Intermediate',
                category: ['swing'],
                description: 'Trades breakouts from key support/resistance levels. Enter long on upside breakouts, short on downside breakouts.',
                performance: this.generatePerformanceData(71, 30)
            },
            {
                id: 'mean-reversion-strategy',
                name: 'Mean Reversion',
                type: 'Statistical Arbitrage',
                winRate: 76,
                bestMarket: 'Volatility 10',
                timeframe: '1 hour',
                level: 'Advanced',
                category: ['algorithmic'],
                description: 'Based on statistical principle that prices tend to return to their historical average. Trades extreme deviations from the mean.',
                performance: this.generatePerformanceData(76, 30)
            }
        ];
        
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.setupFilterButtons();
        this.renderStrategyCharts();
        this.renderOverallPerformanceChart();
        this.setupEventListeners();
    }

    generatePerformanceData(winRate, days) {
        const data = [];
        let currentValue = 100;
        
        for (let i = 0; i < days; i++) {
            const isWin = Math.random() < (winRate / 100);
            const change = isWin ? Math.random() * 5 + 1 : -Math.random() * 3 - 0.5;
            currentValue += change;
            data.push(Math.round(currentValue * 100) / 100);
        }
        
        return data;
    }

    setupFilterButtons() {
        const filterButtons = document.querySelectorAll('.category-filter');
        filterButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                // Update active button
                filterButtons.forEach(btn => {
                    btn.className = 'category-filter bg-white text-gray-700 px-6 py-2 rounded-lg font-medium border border-gray-300 hover:bg-gray-50';
                });
                
                e.target.className = 'category-filter active bg-primary text-white px-6 py-2 rounded-lg font-medium';
                
                // Filter strategies
                this.currentFilter = e.target.dataset.category;
                this.filterStrategies();
            });
        });
    }

    filterStrategies() {
        const strategyCards = document.querySelectorAll('.strategy-card');
        
        strategyCards.forEach(card => {
            const categories = card.dataset.category.split(' ');
            
            if (this.currentFilter === 'all' || categories.includes(this.currentFilter)) {
                card.style.display = 'block';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            } else {
                card.style.opacity = '0.3';
                card.style.transform = 'translateY(10px)';
                setTimeout(() => {
                    if (card.style.opacity === '0.3') {
                        card.style.display = 'none';
                    }
                }, 300);
            }
        });
    }

    renderStrategyCharts() {
        this.strategies.forEach(strategy => {
            const chartElement = document.getElementById(strategy.id.replace('-', '') + 'Chart');
            if (chartElement) {
                this.renderPerformanceChart(chartElement, strategy.performance, strategy.winRate);
            }
        });
    }

    renderPerformanceChart(element, data, winRate) {
        const chart = echarts.init(element);
        
        const option = {
            grid: {
                left: '5%',
                right: '5%',
                top: '10%',
                bottom: '15%'
            },
            xAxis: {
                type: 'category',
                show: false,
                data: data.map((_, index) => index)
            },
            yAxis: {
                type: 'value',
                show: false
            },
            series: [{
                data: data,
                type: 'line',
                smooth: true,
                symbol: 'none',
                lineStyle: {
                    color: winRate >= 70 ? '#10b981' : winRate >= 60 ? '#3b82f6' : '#f59e0b',
                    width: 2
                },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [{
                            offset: 0,
                            color: winRate >= 70 ? 'rgba(16, 185, 129, 0.3)' : 
                                   winRate >= 60 ? 'rgba(59, 130, 246, 0.3)' : 'rgba(245, 158, 11, 0.3)'
                        }, {
                            offset: 1,
                            color: winRate >= 70 ? 'rgba(16, 185, 129, 0.05)' : 
                                   winRate >= 60 ? 'rgba(59, 130, 246, 0.05)' : 'rgba(245, 158, 11, 0.05)'
                        }]
                    }
                }
            }],
            tooltip: {
                trigger: 'axis',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                borderColor: 'transparent',
                textStyle: {
                    color: '#fff',
                    fontSize: 12
                },
                formatter: function(params) {
                    const value = params[0].value;
                    const change = value - 100;
                    const changePercent = (change / 100 * 100).toFixed(2);
                    return `Performance: ${value.toFixed(2)}<br/>Change: ${change >= 0 ? '+' : ''}${changePercent}%`;
                }
            }
        };
        
        chart.setOption(option);
        
        // Make chart responsive
        window.addEventListener('resize', () => {
            chart.resize();
        });
    }

    renderOverallPerformanceChart() {
        const chartElement = document.getElementById('overallPerformanceChart');
        if (!chartElement) return;
        
        const chart = echarts.init(chartElement);
        
        // Generate overall performance data
        const dates = [];
        const values = [];
        let currentValue = 100;
        
        for (let i = 30; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            dates.push(date.toLocaleDateString());
            
            const change = (Math.random() - 0.45) * 3; // Slight positive bias
            currentValue += change;
            values.push(Math.round(currentValue * 100) / 100);
        }
        
        const option = {
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                top: '10%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: dates,
                axisLabel: {
                    color: '#6b7280',
                    fontSize: 10
                },
                axisLine: {
                    lineStyle: {
                        color: '#e5e7eb'
                    }
                }
            },
            yAxis: {
                type: 'value',
                axisLabel: {
                    color: '#6b7280',
                    fontSize: 10,
                    formatter: '{value}%'
                },
                axisLine: {
                    lineStyle: {
                        color: '#e5e7eb'
                    }
                },
                splitLine: {
                    lineStyle: {
                        color: '#f3f4f6'
                    }
                }
            },
            series: [{
                data: values,
                type: 'line',
                smooth: true,
                symbol: 'none',
                lineStyle: {
                    color: '#2563eb',
                    width: 3
                },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [{
                            offset: 0,
                            color: 'rgba(37, 99, 235, 0.3)'
                        }, {
                            offset: 1,
                            color: 'rgba(37, 99, 235, 0.05)'
                        }]
                    }
                }
            }],
            tooltip: {
                trigger: 'axis',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                borderColor: 'transparent',
                textStyle: {
                    color: '#fff',
                    fontSize: 12
                },
                formatter: function(params) {
                    const value = params[0].value;
                    const date = params[0].axisValue;
                    const change = value - 100;
                    const changePercent = (change / 100 * 100).toFixed(2);
                    return `${date}<br/>Performance: ${value.toFixed(2)}%<br/>Change: ${change >= 0 ? '+' : ''}${changePercent}%`;
                }
            }
        };
        
        chart.setOption(option);
        
        window.addEventListener('resize', () => {
            chart.resize();
        });
    }

    useStrategy(strategyId) {
        const strategy = this.strategies.find(s => s.id === strategyId);
        if (!strategy) return;
        
        this.showStrategyModal(strategy);
    }

    showStrategyModal(strategy) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        
        modal.innerHTML = `
            <div class="bg-white rounded-xl max-w-2xl w-full max-h-full overflow-hidden">
                <!-- Modal Header -->
                <div class="bg-gradient-to-r from-primary to-secondary text-white p-6">
                    <div class="flex items-center justify-between mb-4">
                        <div>
                            <h2 class="text-2xl font-bold">${strategy.name}</h2>
                            <p class="text-blue-100">${strategy.type}</p>
                        </div>
                        <button class="text-white hover:text-gray-200" onclick="this.closest('.fixed').remove()">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                    <div class="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <div class="text-2xl font-bold">${strategy.winRate}%</div>
                            <div class="text-sm opacity-90">Win Rate</div>
                        </div>
                        <div>
                            <div class="text-2xl font-bold">${strategy.bestMarket}</div>
                            <div class="text-sm opacity-90">Best Market</div>
                        </div>
                        <div>
                            <div class="text-2xl font-bold">${strategy.timeframe}</div>
                            <div class="text-sm opacity-90">Timeframe</div>
                        </div>
                    </div>
                </div>

                <!-- Modal Content -->
                <div class="p-6">
                    <div class="space-y-6">
                        <div>
                            <h3 class="text-lg font-semibold text-gray-900 mb-2">Strategy Description</h3>
                            <p class="text-gray-600">${strategy.description}</p>
                        </div>
                        
                        <div>
                            <h3 class="text-lg font-semibold text-gray-900 mb-2">How It Works</h3>
                            <div class="space-y-3">
                                <div class="flex items-start space-x-3">
                                    <div class="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                                    <div>
                                        <div class="font-medium text-gray-900">Market Analysis</div>
                                        <div class="text-sm text-gray-600">Monitor price action and indicator signals</div>
                                    </div>
                                </div>
                                <div class="flex items-start space-x-3">
                                    <div class="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                                    <div>
                                        <div class="font-medium text-gray-900">Signal Generation</div>
                                        <div class="text-sm text-gray-600">Generate buy/sell signals based on strategy rules</div>
                                    </div>
                                </div>
                                <div class="flex items-start space-x-3">
                                    <div class="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                                    <div>
                                        <div class="font-medium text-gray-900">Trade Execution</div>
                                        <div class="text-sm text-gray-600">Execute trades with proper risk management</div>
                                    </div>
                                </div>
                                <div class="flex items-start space-x-3">
                                    <div class="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                                    <div>
                                        <div class="font-medium text-gray-900">Position Management</div>
                                        <div class="text-sm text-gray-600">Monitor and manage open positions</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <h3 class="text-lg font-semibold text-gray-900 mb-2">Risk Management</h3>
                            <div class="grid grid-cols-2 gap-4">
                                <div class="p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <div class="text-sm font-medium text-red-900">Stop Loss</div>
                                    <div class="text-xs text-red-700">2% of account balance</div>
                                </div>
                                <div class="p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <div class="text-sm font-medium text-green-900">Take Profit</div>
                                    <div class="text-xs text-green-700">4% of account balance</div>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <h3 class="text-lg font-semibold text-gray-900 mb-2">Performance</h3>
                            <div id="modalPerformanceChart" class="h-48 bg-gray-50 rounded-lg"></div>
                        </div>
                    </div>
                </div>

                <!-- Modal Footer -->
                <div class="border-t border-gray-200 p-6 bg-gray-50">
                    <div class="flex items-center justify-between">
                        <button class="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors" onclick="this.closest('.fixed').remove()">
                            Cancel
                        </button>
                        <div class="flex items-center space-x-3">
                            <button class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors" onclick="strategiesPage.previewStrategy('${strategy.id}')">
                                Preview in Bot Builder
                            </button>
                            <button class="px-6 py-2 bg-primary text-white rounded-lg hover:bg-secondary transition-colors" onclick="strategiesPage.deployStrategy('${strategy.id}')">
                                Deploy Strategy
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // Render performance chart in modal
        setTimeout(() => {
            const modalChart = document.getElementById('modalPerformanceChart');
            if (modalChart) {
                this.renderPerformanceChart(modalChart, strategy.performance, strategy.winRate);
            }
        }, 100);
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    previewStrategy(strategyId) {
        this.showNotification('Redirecting to Bot Builder...', 'info');
        setTimeout(() => {
            window.location.href = 'botbuilder.html';
        }, 1000);
    }

    deployStrategy(strategyId) {
        this.showNotification('Strategy deployment started! Check your dashboard for updates.', 'success');
        
        // Simulate deployment process
        setTimeout(() => {
            this.showNotification('Strategy successfully deployed and is now trading!', 'success');
        }, 3000);
    }

    setupEventListeners() {
        // Add Strategy button
        const addStrategyButton = document.querySelector('button:contains("Add Strategy")');
        if (addStrategyButton) {
            addStrategyButton.addEventListener('click', () => {
                this.showNotification('Strategy builder coming soon!', 'info');
            });
        }
        
        // Strategy builder buttons
        const builderButtons = document.querySelectorAll('button:contains("Start Building"), button:contains("Test Strategy"), button:contains("Deploy Strategy")');
        builderButtons.forEach(button => {
            button.addEventListener('click', () => {
                const text = button.textContent;
                if (text.includes('Start Building')) {
                    window.location.href = 'botbuilder.html';
                } else if (text.includes('Test Strategy')) {
                    this.showNotification('Backtesting feature coming soon!', 'info');
                } else if (text.includes('Deploy Strategy')) {
                    this.showNotification('Strategy deployment feature coming soon!', 'info');
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

// Initialize strategies page when DOM loads
let strategiesPage;
document.addEventListener('DOMContentLoaded', () => {
    strategiesPage = new StrategiesPage();
});