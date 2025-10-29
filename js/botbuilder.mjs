// Bot Builder JavaScript
class BotBuilder {
    constructor() {
        this.canvas = null;
        this.svg = null;
        this.nodes = [];
        this.connections = [];
        this.selectedNode = null;
        this.draggedNode = null;
        this.nodeCounter = 0;
        
        this.init();
    }

    init() {
        this.canvas = document.getElementById('strategyCanvas');
        this.svg = document.getElementById('connectionSvg');
        this.setupDragAndDrop();
        this.setupCanvasEvents();
        this.loadTemplates();
    }

    setupDragAndDrop() {
        // Make component palette items draggable
        const botNodes = document.querySelectorAll('.bot-node');
        botNodes.forEach(node => {
            node.addEventListener('dragstart', (e) => {
                const nodeType = e.target.closest('.bot-node').dataset.type;
                e.dataTransfer.setData('text/plain', nodeType);
                e.dataTransfer.effectAllowed = 'copy';
            });
        });

        // Setup canvas as drop target
        this.canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });

        this.canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            const nodeType = e.dataTransfer.getData('text/plain');
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            this.createNode(nodeType, x, y);
            this.hideWelcomeMessage();
        });
    }

    setupCanvasEvents() {
        // Canvas click to deselect nodes
        this.canvas.addEventListener('click', (e) => {
            if (e.target === this.canvas) {
                this.deselectAllNodes();
            }
        });

        // Right-click context menu
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (e.target.classList.contains('node-element')) {
                this.showContextMenu(e.clientX, e.clientY, e.target);
            }
        });
    }

    createNode(type, x, y) {
        const nodeId = `node-${++this.nodeCounter}`;
        const nodeConfig = this.getNodeConfig(type);
        
        const nodeElement = document.createElement('div');
        nodeElement.id = nodeId;
        nodeElement.className = 'node-element absolute bg-white border-2 border-gray-300 rounded-lg p-3 shadow-lg cursor-pointer';
        nodeElement.style.left = `${x}px`;
        nodeElement.style.top = `${y}px`;
        nodeElement.style.minWidth = '120px';
        nodeElement.style.zIndex = '10';
        
        nodeElement.innerHTML = `
            <div class="flex items-center space-x-2 mb-2">
                <i class="${nodeConfig.icon} ${nodeConfig.color}"></i>
                <span class="text-sm font-medium">${nodeConfig.name}</span>
            </div>
            <div class="text-xs text-gray-600">${nodeConfig.description}</div>
            <div class="flex justify-between mt-2">
                <div class="w-3 h-3 bg-blue-500 rounded-full connection-port" data-type="input" data-node="${nodeId}"></div>
                <div class="w-3 h-3 bg-green-500 rounded-full connection-port" data-type="output" data-node="${nodeId}"></div>
            </div>
        `;
        
        this.canvas.appendChild(nodeElement);
        
        // Store node data
        const node = {
            id: nodeId,
            type: type,
            element: nodeElement,
            x: x,
            y: y,
            config: nodeConfig
        };
        
        this.nodes.push(node);
        this.setupNodeEvents(node);
    }

    setupNodeEvents(node) {
        const element = node.element;
        let isDragging = false;
        let startX, startY, initialX, initialY;

        // Node selection
        element.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectNode(node);
        });

        // Node dragging
        element.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('connection-port')) return;
            
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            initialX = node.x;
            initialY = node.y;
            
            element.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            node.x = initialX + deltaX;
            node.y = initialY + deltaY;
            
            element.style.left = `${node.x}px`;
            element.style.top = `${node.y}px`;
            
            this.updateConnections();
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                element.style.cursor = 'pointer';
            }
        });

        // Connection ports
        const ports = element.querySelectorAll('.connection-port');
        ports.forEach(port => {
            port.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handlePortClick(port, node);
            });
        });
    }

    selectNode(node) {
        this.deselectAllNodes();
        this.selectedNode = node;
        node.element.classList.add('border-primary', 'ring-2', 'ring-primary', 'ring-opacity-50');
        this.showNodeProperties(node);
    }

    deselectAllNodes() {
        this.nodes.forEach(node => {
            node.element.classList.remove('border-primary', 'ring-2', 'ring-primary', 'ring-opacity-50');
        });
        this.selectedNode = null;
        this.hidePropertiesPanel();
    }

    showNodeProperties(node) {
        const propertiesPanel = document.getElementById('propertiesPanel');
        const config = node.config;
        
        propertiesPanel.innerHTML = `
            <div class="space-y-4">
                <div>
                    <h4 class="font-medium text-gray-900 mb-2">${config.name}</h4>
                    <p class="text-sm text-gray-600">${config.description}</p>
                </div>
                
                ${config.properties.map(prop => `
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">${prop.label}</label>
                        ${this.createPropertyInput(prop, node)}
                    </div>
                `).join('')}
                
                <div class="pt-4 border-t border-gray-200">
                    <button class="w-full bg-red-500 text-white py-2 rounded-lg text-sm hover:bg-red-600" 
                            onclick="botBuilder.deleteNode('${node.id}')">
                        <i class="fas fa-trash mr-2"></i>Delete Node
                    </button>
                </div>
            </div>
        `;
    }

    createPropertyInput(prop, node) {
        const nodeId = node.id;
        const value = node.properties?.[prop.name] || prop.default;
        
        switch (prop.type) {
            case 'number':
                return `<input type="number" value="${value}" class="w-full px-2 py-1 border border-gray-300 rounded text-sm" 
                        onchange="botBuilder.updateNodeProperty('${nodeId}', '${prop.name}', this.value)">`;
            
            case 'select':
                const options = prop.options.map(opt => 
                    `<option value="${opt.value}" ${opt.value === value ? 'selected' : ''}>${opt.label}</option>`
                ).join('');
                return `<select class="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        onchange="botBuilder.updateNodeProperty('${nodeId}', '${prop.name}', this.value)">${options}</select>`;
            
            case 'checkbox':
                return `<input type="checkbox" ${value ? 'checked' : ''} class="rounded"
                        onchange="botBuilder.updateNodeProperty('${nodeId}', '${prop.name}', this.checked)">`;
            
            default:
                return `<input type="text" value="${value}" class="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        onchange="botBuilder.updateNodeProperty('${nodeId}', '${prop.name}', this.value)">`;
        }
    }

    updateNodeProperty(nodeId, property, value) {
        const node = this.nodes.find(n => n.id === nodeId);
        if (node) {
            if (!node.properties) node.properties = {};
            
            // Convert value to appropriate type
            const propConfig = node.config.properties.find(p => p.name === property);
            if (propConfig) {
                switch (propConfig.type) {
                    case 'number':
                        value = parseFloat(value) || 0;
                        break;
                    case 'checkbox':
                        value = Boolean(value);
                        break;
                }
            }
            
            node.properties[property] = value;
        }
    }

    deleteNode(nodeId) {
        const nodeIndex = this.nodes.findIndex(n => n.id === nodeId);
        if (nodeIndex !== -1) {
            const node = this.nodes[nodeIndex];
            node.element.remove();
            
            // Remove connections to/from this node
            this.connections = this.connections.filter(conn => 
                conn.from !== nodeId && conn.to !== nodeId);
            
            this.nodes.splice(nodeIndex, 1);
            this.updateConnections();
            this.hidePropertiesPanel();
        }
    }

    hidePropertiesPanel() {
        const propertiesPanel = document.getElementById('propertiesPanel');
        propertiesPanel.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <i class="fas fa-cog text-3xl mb-2"></i>
                <p class="text-sm">Select a component to view its properties</p>
            </div>
        `;
    }

    handlePortClick(port, node) {
        const portData = {
            nodeId: node.id,
            type: port.dataset.type,
            element: port
        };

        if (!this.selectedPort) {
            this.selectedPort = portData;
            port.classList.add('ring-2', 'ring-yellow-400');
        } else {
            if (this.selectedPort.nodeId !== portData.nodeId && 
                this.selectedPort.type !== portData.type) {
                
                const from = this.selectedPort.type === 'output' ? this.selectedPort.nodeId : portData.nodeId;
                const to = this.selectedPort.type === 'input' ? this.selectedPort.nodeId : portData.nodeId;
                
                this.createConnection(from, to);
            }
            
            // Clear selection
            document.querySelectorAll('.connection-port').forEach(p => {
                p.classList.remove('ring-2', 'ring-yellow-400');
            });
            this.selectedPort = null;
        }
    }

    createConnection(fromNodeId, toNodeId) {
        const connectionId = `conn-${fromNodeId}-${toNodeId}`;
        
        // Check if connection already exists
        if (this.connections.find(conn => conn.id === connectionId)) {
            return;
        }
        
        const connection = {
            id: connectionId,
            from: fromNodeId,
            to: toNodeId
        };
        
        this.connections.push(connection);
        this.updateConnections();
    }

    updateConnections() {
        // Clear existing connection lines
        const existingLines = this.svg.querySelectorAll('.connection-line');
        existingLines.forEach(line => line.remove());
        
        // Draw connection lines
        this.connections.forEach(connection => {
            const fromNode = this.nodes.find(n => n.id === connection.from);
            const toNode = this.nodes.find(n => n.id === connection.to);
            
            if (fromNode && toNode) {
                const fromRect = fromNode.element.getBoundingClientRect();
                const toRect = toNode.element.getBoundingClientRect();
                const canvasRect = this.canvas.getBoundingClientRect();
                
                const fromX = fromNode.x + fromNode.element.offsetWidth;
                const fromY = fromNode.y + fromNode.element.offsetHeight / 2;
                const toX = toNode.x;
                const toY = toNode.y + toNode.element.offsetHeight / 2;
                
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                const midX = (fromX + toX) / 2;
                
                const pathData = `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`;
                line.setAttribute('d', pathData);
                line.setAttribute('class', 'connection-line');
                
                this.svg.appendChild(line);
            }
        });
    }

    hideWelcomeMessage() {
        const welcomeMessage = document.getElementById('welcomeMessage');
        if (welcomeMessage) {
            welcomeMessage.style.display = 'none';
        }
    }

    getNodeConfig(type) {
        const configs = {
            'price-feed': {
                name: 'Price Feed',
                description: 'Gets current market price',
                icon: 'fas fa-chart-line',
                color: 'text-blue-600',
                properties: [
                    { name: 'market', label: 'Market', type: 'select', default: 'volatility-100', 
                      options: [
                          { value: 'volatility-100', label: 'Volatility 100' },
                          { value: 'crash-1000', label: 'Crash 1000' },
                          { value: 'boom-1000', label: 'Boom 1000' },
                          { value: 'eur-usd', label: 'EUR/USD' }
                      ]
                    },
                    { name: 'interval', label: 'Update Interval (ms)', type: 'number', default: 1000 }
                ]
            },
            'volume-indicator': {
                name: 'Volume Indicator',
                description: 'Analyzes trading volume',
                icon: 'fas fa-chart-bar',
                color: 'text-green-600',
                properties: [
                    { name: 'period', label: 'Period', type: 'number', default: 14 },
                    { name: 'threshold', label: 'Volume Threshold', type: 'number', default: 1000 }
                ]
            },
            'market-trend': {
                name: 'Market Trend',
                description: 'Detects market direction',
                icon: 'fas fa-trending-up',
                color: 'text-purple-600',
                properties: [
                    { name: 'period', label: 'Period', type: 'number', default: 20 },
                    { name: 'method', label: 'Method', type: 'select', default: 'sma',
                      options: [
                          { value: 'sma', label: 'Simple Moving Average' },
                          { value: 'ema', label: 'Exponential Moving Average' }
                      ]
                    }
                ]
            },
            'rsi': {
                name: 'RSI',
                description: 'Relative Strength Index',
                icon: 'fas fa-wave-square',
                color: 'text-yellow-600',
                properties: [
                    { name: 'period', label: 'Period', type: 'number', default: 14 },
                    { name: 'overbought', label: 'Overbought Level', type: 'number', default: 70 },
                    { name: 'oversold', label: 'Oversold Level', type: 'number', default: 30 }
                ]
            },
            'macd': {
                name: 'MACD',
                description: 'Moving Average Convergence Divergence',
                icon: 'fas fa-wave-square',
                color: 'text-red-600',
                properties: [
                    { name: 'fast', label: 'Fast Period', type: 'number', default: 12 },
                    { name: 'slow', label: 'Slow Period', type: 'number', default: 26 },
                    { name: 'signal', label: 'Signal Period', type: 'number', default: 9 }
                ]
            },
            'bollinger-bands': {
                name: 'Bollinger Bands',
                description: 'Volatility-based indicator',
                icon: 'fas fa-wave-square',
                color: 'text-indigo-600',
                properties: [
                    { name: 'period', label: 'Period', type: 'number', default: 20 },
                    { name: 'stddev', label: 'Standard Deviations', type: 'number', default: 2 }
                ]
            },
            'stochastic': {
                name: 'Stochastic',
                description: 'Stochastic oscillator',
                icon: 'fas fa-wave-square',
                color: 'text-pink-600',
                properties: [
                    { name: 'k-period', label: 'K Period', type: 'number', default: 14 },
                    { name: 'd-period', label: 'D Period', type: 'number', default: 3 },
                    { name: 'smooth', label: 'Smooth', type: 'number', default: 3 }
                ]
            },
            'if-condition': {
                name: 'If Condition',
                description: 'Conditional logic gate',
                icon: 'fas fa-code-branch',
                color: 'text-gray-600',
                properties: [
                    { name: 'condition', label: 'Condition', type: 'select', default: 'greater-than',
                      options: [
                          { value: 'greater-than', label: 'Greater Than' },
                          { value: 'less-than', label: 'Less Than' },
                          { value: 'equals', label: 'Equals' },
                          { value: 'crosses-above', label: 'Crosses Above' },
                          { value: 'crosses-below', label: 'Crosses Below' }
                      ]
                    }
                ]
            },
            'comparison': {
                name: 'Comparison',
                description: 'Compare two values',
                icon: 'fas fa-equals',
                color: 'text-orange-600',
                properties: [
                    { name: 'operator', label: 'Operator', type: 'select', default: 'greater-than',
                      options: [
                          { value: 'greater-than', label: '>' },
                          { value: 'less-than', label: '<' },
                          { value: 'equals', label: '=' },
                          { value: 'not-equals', label: '!=' }
                      ]
                    }
                ]
            },
            'logical-and': {
                name: 'AND Gate',
                description: 'Logical AND operation',
                icon: 'fas fa-and',
                color: 'text-teal-600',
                properties: [
                    { name: 'inputs', label: 'Number of Inputs', type: 'number', default: 2 }
                ]
            },
            'buy-action': {
                name: 'Buy Action',
                description: 'Execute buy order',
                icon: 'fas fa-arrow-up',
                color: 'text-green-600',
                properties: [
                    { name: 'amount', label: 'Amount ($)', type: 'number', default: 100 },
                    { name: 'duration', label: 'Duration', type: 'select', default: '5m',
                      options: [
                          { value: '1m', label: '1 minute' },
                          { value: '5m', label: '5 minutes' },
                          { value: '15m', label: '15 minutes' },
                          { value: '1h', label: '1 hour' }
                      ]
                    }
                ]
            },
            'sell-action': {
                name: 'Sell Action',
                description: 'Execute sell order',
                icon: 'fas fa-arrow-down',
                color: 'text-red-600',
                properties: [
                    { name: 'amount', label: 'Amount ($)', type: 'number', default: 100 },
                    { name: 'duration', label: 'Duration', type: 'select', default: '5m',
                      options: [
                          { value: '1m', label: '1 minute' },
                          { value: '5m', label: '5 minutes' },
                          { value: '15m', label: '15 minutes' },
                          { value: '1h', label: '1 hour' }
                      ]
                    }
                ]
            },
            'stop-loss': {
                name: 'Stop Loss',
                description: 'Risk management order',
                icon: 'fas fa-shield-alt',
                color: 'text-blue-600',
                properties: [
                    { name: 'percentage', label: 'Stop Loss %', type: 'number', default: 2 },
                    { name: 'trailing', label: 'Trailing Stop', type: 'checkbox', default: false }
                ]
            },
            'take-profit': {
                name: 'Take Profit',
                description: 'Profit target order',
                icon: 'fas fa-target',
                color: 'text-purple-600',
                properties: [
                    { name: 'percentage', label: 'Take Profit %', type: 'number', default: 5 },
                    { name: 'multiple-targets', label: 'Multiple Targets', type: 'checkbox', default: false }
                ]
            }
        };
        
        return configs[type] || configs['price-feed'];
    }

    loadTemplates() {
        const templateButtons = document.querySelectorAll('button:contains("Use Template")');
        // Note: The above selector won't work, let's use a different approach
        
        const buttons = document.querySelectorAll('.bg-primary');
        buttons.forEach((button, index) => {
            if (button.textContent.includes('Use Template')) {
                button.addEventListener('click', () => {
                    this.loadTemplate(index);
                });
            }
        });
    }

    loadTemplate(templateIndex) {
        // Clear existing nodes
        this.clearCanvas();
        
        const templates = [
            // RSI Strategy Template
            [
                { type: 'price-feed', x: 100, y: 100 },
                { type: 'rsi', x: 300, y: 100 },
                { type: 'if-condition', x: 500, y: 100 },
                { type: 'buy-action', x: 700, y: 50 },
                { type: 'sell-action', x: 700, y: 150 }
            ],
            // MACD Strategy Template
            [
                { type: 'price-feed', x: 100, y: 100 },
                { type: 'macd', x: 300, y: 100 },
                { type: 'if-condition', x: 500, y: 100 },
                { type: 'buy-action', x: 700, y: 50 },
                { type: 'sell-action', x: 700, y: 150 }
            ],
            // Bollinger Bands Template
            [
                { type: 'price-feed', x: 100, y: 100 },
                { type: 'bollinger-bands', x: 300, y: 100 },
                { type: 'if-condition', x: 500, y: 100 },
                { type: 'buy-action', x: 700, y: 50 },
                { type: 'sell-action', x: 700, y: 150 }
            ]
        ];
        
        const template = templates[templateIndex];
        if (template) {
            template.forEach(nodeData => {
                this.createNode(nodeData.type, nodeData.x, nodeData.y);
            });
            
            // Auto-connect nodes in sequence
            for (let i = 0; i < template.length - 1; i++) {
                if (template[i + 1]) {
                    this.createConnection(`node-${this.nodeCounter - template.length + i + 1}`, 
                                         `node-${this.nodeCounter - template.length + i + 2}`);
                }
            }
            
            this.hideWelcomeMessage();
            this.showNotification(`${['RSI', 'MACD', 'Bollinger Bands'][templateIndex]} strategy template loaded!`, 'success');
        }
    }

    clearCanvas() {
        this.nodes.forEach(node => {
            node.element.remove();
        });
        this.nodes = [];
        this.connections = [];
        this.nodeCounter = 0;
        this.updateConnections();
        
        const welcomeMessage = document.getElementById('welcomeMessage');
        if (welcomeMessage) {
            welcomeMessage.style.display = 'flex';
        }
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

    showContextMenu(x, y, element) {
        // Remove existing context menu
        const existingMenu = document.querySelector('.context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }
        
        const menu = document.createElement('div');
        menu.className = 'context-menu fixed bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50';
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;
        
        menu.innerHTML = `
            <button class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" 
                    onclick="botBuilder.deleteNode('${element.id}')">
                <i class="fas fa-trash mr-2"></i>Delete
            </button>
            <button class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onclick="botBuilder.duplicateNode('${element.id}')">
                <i class="fas fa-copy mr-2"></i>Duplicate
            </button>
        `;
        
        document.body.appendChild(menu);
        
        // Close menu on click outside
        setTimeout(() => {
            document.addEventListener('click', () => {
                menu.remove();
            }, { once: true });
        }, 100);
    }

    duplicateNode(nodeId) {
        const node = this.nodes.find(n => n.id === nodeId);
        if (node) {
            this.createNode(node.type, node.x + 50, node.y + 50);
        }
    }
}

// Initialize bot builder when page loads
let botBuilder;
document.addEventListener('DOMContentLoaded', () => {
    botBuilder = new BotBuilder();
});

// Add clear and test button functionality
document.addEventListener('DOMContentLoaded', () => {
    const clearButton = document.querySelector('button:contains("Clear")');
    const testButton = document.querySelector('button:contains("Test")');
    
    // Alternative way to find buttons
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        if (button.textContent.includes('Clear')) {
            button.addEventListener('click', () => {
                if (confirm('Are you sure you want to clear the canvas?')) {
                    botBuilder.clearCanvas();
                }
            });
        }
        
        if (button.textContent.includes('Test')) {
            button.addEventListener('click', () => {
                botBuilder.showNotification('Strategy test started! Check the console for results.', 'info');
                // Here you would implement the actual strategy testing logic
            });
        }
    });
});