import { authService } from './authService.js';

// Trading Dashboard JavaScript
class TradingDashboard {
    constructor() {
        this.chart = null;
        this.priceData = [];
        this.currentPrice = 0;
        this.isLive = true;
        this.trades = [];
        this.ws = null;
        this.selectedMarket = 'R_100'; // Default market
        this.tickCount = 20;
        
        this.init();
    }

    async init() {
        try {
            // Initialize WebSocket connection
            await this.connectToDerivAPI();
            
            // Initialize chart
            this.initializeChart();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Request initial market data
            this.requestMarketData();
        } catch (error) {
            console.error('Initialization error:', error);
            this.showNotification('Failed to initialize trading dashboard', 'error');
        }
    }

    connectToDerivAPI() {
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=61696');
            
            this.ws.onopen = () => {
                console.log('Connected to Deriv API');
                
                // Request active symbols once connected
                this.ws.send(JSON.stringify({
                    active_symbols: "brief",
                    product_type: "basic"
                }));
                
                resolve();
            };
            
            this.ws.onmessage = (msg) => {
                try {
                    const data = JSON.parse(msg.data);
                    
                    if (data.tick) {
                        this.handleTickData(data.tick);
                    } else if (data.history) {
                        this.handleHistoricalData(data.history);
                    } else if (data.active_symbols) {
                        this.populateMarketSelector(data.active_symbols);
                    }
                } catch (error) {
                    console.error('Message handling error:', error);
                }
            };
            
            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                reject(error);
            };

            this.ws.onclose = () => {
                console.log('WebSocket connection closed');
                this.isLive = false;
                // Attempt to reconnect after 5 seconds
                setTimeout(() => this.connectToDerivAPI(), 5000);
            };
        });
    }

    requestMarketData() {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        // Unsubscribe from previous subscriptions
        this.ws.send(JSON.stringify({
            forget_all: 'ticks'
        }));

        // Request new market data
        const request = {
            ticks_history: this.selectedMarket,
            adjust_start_time: 1,
            count: this.tickCount,
            end: 'latest',
            start: 1,
            style: 'ticks',
            subscribe: 1
        };

        this.ws.send(JSON.stringify(request));
    }

    handleTickData(tick) {
        if (tick.symbol !== this.selectedMarket) return;

        const newDataPoint = {
            time: new Date(tick.epoch * 1000),
            price: parseFloat(tick.quote),
            volume: Math.floor(Math.random() * 1000) + 100
        };
        
        this.priceData.push(newDataPoint);
        this.currentPrice = newDataPoint.price;
        
        // Keep only last N ticks
        while (this.priceData.length > this.tickCount) {
            this.priceData.shift();
        }
        
        // Update UI with new data
        requestAnimationFrame(() => {
            this.updateChart();
            this.updateStats();
            this.addTradeToHistory(newDataPoint);
        });
    }

    handleHistoricalData(history) {
        if (!history.prices) return;

        this.priceData = history.prices.map((price, index) => ({
            time: new Date(history.times[index] * 1000),
            price: parseFloat(price),
            volume: Math.floor(Math.random() * 1000) + 100
        }));

        if (this.priceData.length > 0) {
            this.currentPrice = this.priceData[this.priceData.length - 1].price;
        }

        this.updateUI();
    }

    updateUI() {
        this.updateChart();
        this.updateStats();
        this.updateActivePositions();
    }

    updateStats() {
        const priceElement = document.getElementById('currentPrice');
        if (!priceElement) return;

        priceElement.textContent = `$${this.currentPrice.toFixed(2)}`;

        // Update price change
        if (this.priceData.length >= 2) {
            const oldPrice = this.priceData[this.priceData.length - 2].price;
            const change = ((this.currentPrice - oldPrice) / oldPrice) * 100;
            
            const changeElement = priceElement.parentElement.nextElementSibling?.querySelector('span');
            if (changeElement) {
                const changeText = (change >= 0 ? '+' : '') + change.toFixed(2) + '%';
                changeElement.textContent = changeText;
                changeElement.className = `text-${change >= 0 ? 'green' : 'red'}-600 text-sm font-medium`;
            }
        }
    }

    initializeChart() {
        const chartDom = document.getElementById('tradingChart');
        if (!chartDom) return;

        this.chart = echarts.init(chartDom);
        
        const option = {
            animation: true,
            grid: {
                left: '3%',
                right: '4%',
                bottom: '10%', // give more room for rotated labels
                containLabel: true
            },
            tooltip: {
                trigger: 'axis',
                formatter: function (params) {
                    const data = params[0].data;
                    return `Time: ${new Date(data[0]).toLocaleTimeString()}<br/>Price: $${data[1].toFixed(2)}`;
                }
            },
            xAxis: {
                type: 'time',
                boundaryGap: false,
                axisTick: {
                    alignWithLabel: true
                },
                axisLabel: {
                    // show compact time (HH:MM) and avoid overlap
                    formatter: function (value) {
                        const d = new Date(value);
                        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    },
                    rotate: 40,
                    margin: 10,
                    hideOverlap: true,   // ECharts 5+ option to avoid overlapping labels
                    overflow: 'truncate'
                },
                splitLine: {
                    show: false
                }
            },
            yAxis: {
                type: 'value',
                scale: true,
                splitLine: {
                    show: true,
                    lineStyle: {
                        type: 'dashed'
                    }
                },
                axisLabel: {
                    formatter: function (value) {
                        const num = Number(value);
                        if (Number.isFinite(num)) return num.toFixed(2);
                        return String(value);
                    }
                }
            },
            dataZoom: [
                {
                    type: 'inside',
                    throttle: 100
                },
                {
                    show: false,
                    type: 'slider'
                }
            ],
            series: [{
                name: 'Price',
                type: 'line',
                smooth: true,
                symbol: 'none',
                lineStyle: {
                    width: 2
                },
                areaStyle: {
                    opacity: 0.08
                },
                data: []
            }]
        };
        
        this.chart.setOption(option);
        
        // Make chart responsive
        window.addEventListener('resize', () => {
            this.chart.resize();
        });
    }

    updateChart() {
        if (!this.chart || !this.priceData.length) return;

        const data = this.priceData.map(point => [
            point.time.getTime(),
            point.price
        ]);

        const minPrice = Math.min(...this.priceData.map(p => p.price));
        const maxPrice = Math.max(...this.priceData.map(p => p.price));
        const padding = Math.max((maxPrice - minPrice) * 0.1, 0.0001); // avoid zero padding

        this.chart.setOption({
            xAxis: {
                // keep ECharts default interval logic but ensure labels use timestamps
                // no explicit min/max so ECharts places ticks nicely
            },
            yAxis: {
                min: +(minPrice - padding).toFixed(2),
                max: +(maxPrice + padding).toFixed(2),
                axisLabel: {
                    formatter: function (value) {
                        const num = Number(value);
                        if (Number.isFinite(num)) return num.toFixed(2);
                        return String(value);
                    }
                }
            },
            series: [{
                data: data
            }]
        });
    }

    startPriceUpdates() {
        setInterval(() => {
            // only run local/random updates when using mock data
            if (this.isLive && this.useMockData) {
                this.updatePrice();
            }
        }, 2000); // Update every 2 seconds
    }

    updatePrice() {
        // Guard: only do random/mock updates when useMockData is true
        if (!this.useMockData) return;

        const lastPrice = this.priceData[this.priceData.length - 1]?.price || this.currentPrice;
        const variation = (Math.random() - 0.5) * 4; // ±2 variation
        const newPrice = Math.round((lastPrice + variation) * 100) / 100;
        
        const newDataPoint = {
            time: new Date(),
            price: newPrice,
            volume: Math.floor(Math.random() * 1000) + 100
        };
        
        this.priceData.push(newDataPoint);
        this.currentPrice = newPrice;
        
        // Keep only last 100 data points
        if (this.priceData.length > 100) {
            this.priceData.shift();
        }
        
        this.updateChart();
        this.updateStats();
        this.addTradeToHistory(newDataPoint);
    }

    addTradeToHistory(dataPoint) {
        const recentTradesContainer = document.querySelector('.max-h-48.overflow-y-auto');
        if (!recentTradesContainer) return;
        
        const tradeElement = document.createElement('div');
        tradeElement.className = 'flex justify-between items-center py-1 text-xs';
        
        const isBuy = Math.random() > 0.5;
        const tradeType = isBuy ? 'BUY' : 'SELL';
        const colorClass = isBuy ? 'text-green-600' : 'text-red-600';
        const time = new Date().toLocaleTimeString();
        
        tradeElement.innerHTML = `
            <div>
                <span class="${colorClass} font-medium">${tradeType}</span>
                <span class="text-gray-600 ml-2">$${dataPoint.price.toFixed(2)}</span>
            </div>
            <span class="text-gray-500">${time}</span>
        `;
        
        recentTradesContainer.insertBefore(tradeElement, recentTradesContainer.firstChild);
        
        // Keep only last 10 trades visible
        const trades = recentTradesContainer.children;
        if (trades.length > 10) {
            recentTradesContainer.removeChild(trades[trades.length - 1]);
        }
    }

    setupEventListeners() {
        // Buy/Sell buttons
        const buyButton = document.querySelector('.bg-green-500');
        const sellButton = document.querySelector('.bg-red-500');
        
        if (buyButton) {
            buyButton.addEventListener('click', () => this.executeTrade('buy'));
        }
        
        if (sellButton) {
            sellButton.addEventListener('click', () => this.executeTrade('sell'));
        }
        
        // Timeframe buttons
        const timeframeButtons = document.querySelectorAll('button[class*="bg-gray-100"]');
        timeframeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                // Remove active class from all buttons
                timeframeButtons.forEach(btn => {
                    btn.className = 'px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200';
                });
                // Add active class to clicked button
                e.target.className = 'px-3 py-1 bg-primary text-white rounded text-sm';
            });
        });
        
        // Market selector
        const marketSelector = document.getElementById('marketSelector');
        if (marketSelector) {
            marketSelector.addEventListener('change', (e) => {
                this.selectedMarket = e.target.value;
                this.priceData = [];
                this.requestMarketData();
            });
        }
        
        // Tick count input
        const tickCountInput = document.getElementById('tickCountInput');
        if (tickCountInput) {
            tickCountInput.addEventListener('change', (e) => {
                this.tickCount = parseInt(e.target.value) || 20;
                this.requestMarketData();
            });
        }
        
        // New Trade button
        const newTradeButton = document.querySelector('button[class*="bg-primary"]:not(.bg-green-500):not(.bg-red-500)');
        if (newTradeButton) {
            newTradeButton.addEventListener('click', () => {
                this.showNewTradeModal();
            });
        }

        // Account button (for auth)
        const accountBtn = document.querySelector('button:has(i.fas.fa-user)');
        if (accountBtn) {
            authService.onAuthChange((user) => {
                if (user) {
                    accountBtn.innerHTML = `
                        <div class="flex items-center space-x-2">
                            <span class="text-sm ${user.is_virtual ? 'text-gray-600' : 'text-green-600'}">
                                ${user.is_virtual ? 'Demo' : 'Live'}
                            </span>
                            <span class="text-sm font-medium">${user.balance} ${user.currency}</span>
                        </div>
                    `;
                } else {
                    accountBtn.innerHTML = '<i class="fas fa-user mr-2"></i>Login';
                }
            });

            accountBtn.addEventListener('click', () => {
                if (!authService.user) {
                    authService.login().catch(console.error);
                } else {
                    // Show logout confirmation
                    if (confirm('Do you want to logout?')) {
                        authService.logout();
                    }
                }
            });
        }
    }

    executeTrade(type) {
        const amount = document.querySelector('input[type="number"]').value;
        const duration = document.querySelector('select').selectedOptions[0].text;
        
        const trade = {
            id: Date.now(),
            type: type.toUpperCase(),
            amount: parseFloat(amount),
            price: this.currentPrice,
            duration: duration,
            timestamp: new Date(),
            status: 'active'
        };
        
        this.trades.push(trade);
        this.showTradeNotification(trade);
        this.updateActivePositions();
    }

    showTradeNotification(trade) {
        const notification = document.createElement('div');
        notification.className = `fixed top-20 right-4 p-4 rounded-lg shadow-lg z-50 ${
            trade.type === 'BUY' ? 'bg-green-500' : 'bg-red-500'
        } text-white`;
        
        notification.innerHTML = `
            <div class="flex items-center space-x-2">
                <i class="fas fa-${trade.type === 'BUY' ? 'arrow-up' : 'arrow-down'}"></i>
                <span class="font-medium">${trade.type} Trade Executed</span>
            </div>
            <div class="text-sm mt-1">
                Amount: $${trade.amount} | Price: $${trade.price.toFixed(2)}
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    updateActivePositions() {
        const activePositionsContainer = document.querySelector('.space-y-3');
        if (!activePositionsContainer) return;
        
        // Clear existing positions (except the template ones)
        const existingPositions = activePositionsContainer.querySelectorAll('.p-3');
        // Keep the first 2 as examples, remove others
        for (let i = 2; i < existingPositions.length; i++) {
            existingPositions[i].remove();
        }
        
        // Add current trades
        this.trades.slice(-3).forEach(trade => {
            const positionElement = document.createElement('div');
            const isProfitable = Math.random() > 0.5; // Simulate profit/loss
            const bgColor = isProfitable ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
            const textColor = isProfitable ? 'text-green-800' : 'text-red-800';
            const pnl = isProfitable ? '+$45.60' : '-$12.30';
            const pnlColor = isProfitable ? 'text-green-600' : 'text-red-600';
            
            positionElement.className = `p-3 border rounded-lg ${bgColor}`;
            positionElement.innerHTML = `
                <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-medium ${textColor}">${trade.type} - Vol 100</span>
                    <span class="text-xs ${pnlColor}">${isProfitable ? '+12.3%' : '-2.1%'}</span>
                </div>
                <div class="text-xs ${textColor}">
                    <div>Entry: $${trade.price.toFixed(2)}</div>
                    <div>Current: $${(trade.price + (Math.random() - 0.5) * 10).toFixed(2)}</div>
                    <div>P/L: <span class="font-medium">${pnl}</span></div>
                </div>
            `;
            
            activePositionsContainer.appendChild(positionElement);
        });
    }

    async switchMarket(marketSymbol) {
        if (this.isSwitchingMarket) return;
        this.isSwitchingMarket = true;

        try {
            // Unsubscribe from previous market
            if (this.ws) {
                this.ws.send(JSON.stringify({
                    forget_all: 'ticks'
                }));
            }

            this.selectedMarket = marketSymbol;
            this.priceData = [];
            
            // Request new market data
            const request = {
                ticks_history: marketSymbol,
                adjust_start_time: 1,
                count: this.tickCount,
                end: 'latest',
                start: 1,
                style: 'ticks',
                subscribe: 1
            };

            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify(request));
            }

            // Update UI immediately
            this.updateChart();
            this.updateStats();
            
        } catch (error) {
            console.error('Error switching market:', error);
            this.showNotification('Error switching market', 'error');
        } finally {
            this.isSwitchingMarket = false;
        }
    }

    // Add this helper method to get market name
    getMarketName(marketSymbol) {
        return new Promise((resolve) => {
            const messageHandler = (msg) => {
                const data = JSON.parse(msg.data);
                if (data.active_symbols) {
                    const market = data.active_symbols.find(s => s.symbol === marketSymbol);
                    this.ws.removeEventListener('message', messageHandler);
                    resolve(market ? market.display_name : marketSymbol);
                }
            };
            
            this.ws.addEventListener('message', messageHandler);
            
            // Request active symbols
            this.ws.send(JSON.stringify({
                active_symbols: 'brief',
                product_type: 'basic'
            }));
        });
    }
    
    // Clean up WebSocket connection when needed
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    showNewTradeModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        
        modal.innerHTML = `
            <div class="bg-white rounded-xl p-6 w-96 max-w-90vw">
                <h3 class="text-xl font-bold text-gray-900 mb-4">Create New Trade</h3>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Market</label>
                        <select class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                            <option>Volatility 100 Index</option>
                            <option>Crash 1000 Index</option>
                            <option>Boom 1000 Index</option>
                            <option>Forex - EUR/USD</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Trade Type</label>
                        <div class="flex space-x-2">
                            <button class="flex-1 bg-green-500 text-white py-2 rounded-lg font-medium">BUY</button>
                            <button class="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-medium">SELL</button>
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Amount ($)</label>
                        <input type="number" value="100" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                        <select class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                            <option>1 minute</option>
                            <option>5 minutes</option>
                            <option>15 minutes</option>
                            <option>1 hour</option>
                        </select>
                    </div>
                </div>
                <div class="flex space-x-3 mt-6">
                    <button class="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-medium" onclick="this.closest('.fixed').remove()">Cancel</button>
                    <button class="flex-1 bg-primary text-white py-2 rounded-lg font-medium" onclick="this.closest('.fixed').remove()">Create Trade</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
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

    populateMarketSelector(activeSymbols) {
        const marketSelector = document.getElementById('marketSelector');
        if (!marketSelector) return;

        // keep the currently selected value if possible
        const previousValue = marketSelector.value;

        // Build new options
        const sortedSymbols = (Array.isArray(activeSymbols) ? activeSymbols.slice() : [])
            .sort((a, b) => a.display_name.localeCompare(b.display_name));

        // Replace options
        marketSelector.innerHTML = '';
        sortedSymbols.forEach(symbol => {
            const option = document.createElement('option');
            option.value = symbol.symbol;
            option.textContent = symbol.display_name;
            marketSelector.appendChild(option);
        });

        // If previous selection still exists, keep it. Otherwise default to first.
        const hasPrevious = sortedSymbols.some(s => s.symbol === previousValue);
        const newValue = hasPrevious ? previousValue : (sortedSymbols[0]?.symbol || '');
        const valueChanged = marketSelector.value !== newValue;

        marketSelector.value = newValue;

        // Only trigger change if we programmatically changed the selection
        if (valueChanged && newValue) {
            marketSelector.dispatchEvent(new Event('change'));
        }
    }
}

// Initialize the trading dashboard when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new TradingDashboard();
});

// Add some interactive effects
document.addEventListener('DOMContentLoaded', () => {
    // Add hover effects to cards
    const cards = document.querySelectorAll('.card-hover');
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-5px)';
            card.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.1)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
            card.style.boxShadow = '';
        });
    });
    
    // Add click effects to watchlist items
    const watchlistItems = document.querySelectorAll('.hover\\:bg-gray-100');
    watchlistItems.forEach(item => {
        item.addEventListener('click', () => {
            // Add a subtle flash effect
            item.style.backgroundColor = '#dbeafe';
            setTimeout(() => {
                item.style.backgroundColor = '';
            }, 200);
        });
    });
});