const selectorInput = document.getElementById('selector-input');
const goButton = document.getElementById('go-button');
const stripButton = document.getElementById('strip-button');
const visualizeButton = document.getElementById('visualize-button');
const clearButton = document.getElementById('clear-visuals-button');
const statusMessage = document.getElementById('status-message');

// --- Shared Clipboard Function (lives in the panel's context) ---
const copyToClipboard = (text, type) => {
    try {
        const textArea = document.createElement('textarea'); textArea.style.position = 'fixed'; textArea.style.opacity = 0;
        textArea.value = text; document.body.appendChild(textArea);
        textArea.focus(); textArea.select(); document.execCommand('copy');
        document.body.removeChild(textArea);
        statusMessage.textContent = `Success! ${type} copied to clipboard.`; statusMessage.style.color = 'green';
    } catch (err) {
        statusMessage.textContent = `Error: Copy command failed. See console.`; statusMessage.style.color = 'red'; console.error("Copy failed:", err);
    }
};

// --- Injected Functions (These will be converted to strings and run on the inspected page) ---

const getElementData = (targetSelector) => {
    const elements = document.querySelectorAll(targetSelector);
    if (!elements || elements.length === 0) { return `ERROR: No element(s) found for selector "${targetSelector}"`; }
    let finalReport = '# AI CONTEXT REPORT\n';
    elements.forEach((element, index) => {
        const parentStyles = window.getComputedStyle(element);
        const styleProps = ['display','position','top','right','bottom','left','z-index','width','height','min-width','max-width','min-height','max-height','margin','padding','border','outline','box-shadow','border-radius','font-size','font-weight','font-family','line-height','color','text-align','background-color','background-image','opacity','transform','transition','flex-direction','flex-wrap','justify-content','align-items','gap'];
        const getStylesForElementAndChildren = (el, depth = 0) => {
            let output = ''; const indent = '  '.repeat(depth); let descriptor = el.tagName.toLowerCase();
            if (el.id) descriptor += `#${el.id}`; if (el.classList.length > 0) descriptor += `.${Array.from(el.classList).join('.')}`;
            const isParent = depth === 0; let reportContent = ''; let overriddenStylesFound = 0; const currentStyles = window.getComputedStyle(el);
            for (const prop of styleProps) {
                const currentValue = currentStyles.getPropertyValue(prop); const parentValue = isParent ? null : parentStyles.getPropertyValue(prop);
                if (isParent || currentValue !== parentValue) {
                     if (currentValue && currentValue !== 'normal' && currentValue !== 'auto' && currentValue !== '0px' && !currentValue.startsWith('rgba(0, 0, 0, 0)')) {
                        reportContent += `${prop}: ${currentValue};\n`; if (!isParent) overriddenStylesFound++;
                    }
                }
            }
            if (isParent || overriddenStylesFound > 0) {
                output += `\n### ${indent}Element: \`<${descriptor}>\`\n`;
                if (isParent) { output += `These are the base styles for this component. Descendants will only show overrides.\n`; }
                output += `\`\`\`css\n${reportContent}\`\`\`\n`;
            }
            for (const child of el.children) { output += getStylesForElementAndChildren(child, depth + 1); } return output;
        };
        let elementId = element.id ? `#${element.id}` : ''; let elementClasses = element.className && typeof element.className === 'string' ? `.${element.className.trim().replace(/\s+/g, '.')}` : '';
        finalReport += `\n## Report for Element ${index + 1}: \`${element.tagName.toLowerCase()}${elementId}${elementClasses}\`\n`;
        finalReport += `\n### Live Rendered HTML\n\n\`\`\`html\n${element.outerHTML}\n\`\`\`\n`;
        finalReport += `\n### Computed CSS Styles (Inheritance Model)\n${getStylesForElementAndChildren(element)}`;
        if (index < elements.length - 1) { finalReport += '\n\n---\n'; }
    });
    return finalReport.trim();
};

const getAndStripHtml = () => {
    const svgGroupContentThreshold = 500; const longPathThreshold = 50; let content = document.documentElement.outerHTML;
    content = content.replace(/<style[^>]*>.*?<\/style>/gis, ''); content = content.replace(/<script[^>]*>.*?<\/script>/gis, '');
    content = content.replace(/"https?:\/\/[^"]*"|'https?:\/\/[^']*'/g, '"url_stripped"');
    const svgGroupRegex = new RegExp(`(<g\\b[^>]*>)(.{${svgGroupContentThreshold},}?)(<\\/g>)`, 'gis');
    content = content.replace(svgGroupRegex, '$1<!-- SVG group content truncated -->$3');
    const pathDataRegex = new RegExp(`d=(["'])(?!stripped-content).{${longPathThreshold},}?.*?\\1`, 'g');
    content = content.replace(pathDataRegex, 'd="stripped-content"'); content = content.replace(/(\r?\n){4,}/g, '\n\n\n'); return content;
};

const clearAiVisualization = () => {
    const existingContainer = document.getElementById('ai-visualizer-container');
    if (existingContainer) {
        existingContainer.remove();
        return "Visualization cleared.";
    }
    return "No visualization to clear.";
};

const visualizeAndAnalyze = () => {
    // This is the self-contained v7.8 visualizer
    const parentElement = window.$0;
    if (!parentElement) { return "Error: No element selected in the Elements panel."; }

    // Define clear function in this scope to be self-contained
    const clearViz = () => {
        const existingContainer = document.getElementById('ai-visualizer-container');
        if (existingContainer) existingContainer.remove();
    };
    clearViz();

    const LABEL_SIZE = 20; const PANEL_MARGIN = 15; const PANEL_STEP = 5;
    const container = document.createElement('div'); container.id = 'ai-visualizer-container'; document.body.appendChild(container);
    const getColor = (index) => index === 0 ? '#DC2626' : `hsl(${((index - 1) * 137.508) % 360}, 80%, 50%)`;
    const collectElementsRecursive = (element, collected) => {
        collected.push(element);
        if (element.tagName.toLowerCase() === 'svg') return;
        for (const child of element.children) { collectElementsRecursive(child, collected); }
    };
    const elementsToProcess = [];
    collectElementsRecursive(parentElement, elementsToProcess);

    const allElementsData = elementsToProcess.filter(el => el.getBoundingClientRect().width > 1 && el.getBoundingClientRect().height > 1).map((el, index) => {
        const rect = el.getBoundingClientRect(); let descriptor = el.tagName.toLowerCase();
        if (el.id) descriptor += `#${el.id}`; if (el.classList.length > 0) descriptor += `.${Array.from(el.classList).join('.')}`;
        if (descriptor.length > 60) descriptor = descriptor.substring(0, 57) + '...';
        return { el, id: index + 1, isParent: index === 0, rect, color: getColor(index), descriptor, center: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } };
    });

    const placedLabelRects = []; const unplaceableElements = [];
    allElementsData.forEach(data => {
        const outline = document.createElement('div'); Object.assign(outline.style, { position: 'fixed', top: `${data.rect.top}px`, left: `${data.rect.left}px`, width: `${data.rect.width}px`, height: `${data.rect.height}px`, border: `2px ${data.isParent ? 'solid' : 'dashed'} ${data.color}`, zIndex: 9000, pointerEvents: 'none', boxSizing: 'border-box' }); container.appendChild(outline);
        const positions = [{ top: data.rect.top, left: data.rect.left }, { top: data.rect.top, left: data.rect.right - LABEL_SIZE }, { top: data.rect.bottom - LABEL_SIZE, left: data.rect.left }, { top: data.rect.bottom - LABEL_SIZE, left: data.rect.right - LABEL_SIZE }];
        let bestPosition = null;
        for (const pos of positions) {
            const newRect = { top: pos.top, left: pos.left, right: pos.left + LABEL_SIZE, bottom: pos.top + LABEL_SIZE };
            const overlap = placedLabelRects.some(r => !(newRect.right < r.left || newRect.left > r.right || newRect.bottom < r.top || newRect.top > r.bottom));
            if (!overlap) { bestPosition = pos; break; }
        }
        if (bestPosition) {
            placedLabelRects.push({ top: bestPosition.top, left: bestPosition.left, right: bestPosition.left + LABEL_SIZE, bottom: bestPosition.top + LABEL_SIZE });
            const label = document.createElement('div'); label.textContent = data.id; Object.assign(label.style, { position: 'fixed', top: `${bestPosition.top}px`, left: `${bestPosition.left}px`, backgroundColor: data.color, color: 'white', fontSize: '12px', fontWeight: 'bold', borderRadius: '50%', width: `${LABEL_SIZE}px`, height: `${LABEL_SIZE}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9500 }); container.appendChild(label);
        } else unplaceableElements.push(data);
    });

    const groups = []; const children = Array.from(parentElement.children); let groupIdCounter = 1;
    children.forEach(child => {
        const descendants = [child, ...child.querySelectorAll('*')]; const unplaceable = unplaceableElements.filter(ue => descendants.includes(ue.el));
        if (unplaceable.length > 2) { groups.push({ id: groupIdCounter++, members: unplaceable }); unplaceable.forEach(ue => { const idx = unplaceableElements.indexOf(ue); if (idx > -1) unplaceableElements.splice(idx, 1); }); }
    });
    if (unplaceableElements.length > 0) groups.push({ id: groupIdCounter++, members: unplaceableElements });

    const createGroupMarker = (group) => {
        const centerX = group.members.reduce((sum, d) => sum + d.center.x, 0) / group.members.length; const centerY = group.members.reduce((sum, d) => sum + d.center.y, 0) / group.members.length;
        const marker = document.createElement('div'); marker.textContent = `g${group.id}`; Object.assign(marker.style, { position: 'fixed', top: `${centerY - LABEL_SIZE / 2}px`, left: `${centerX - LABEL_SIZE / 2}px`, backgroundColor: 'black', color: 'white', fontSize: '12px', fontWeight: 'bold', borderRadius: '50%', width: `${LABEL_SIZE}px`, height: `${LABEL_SIZE}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, pointerEvents: 'none' }); container.appendChild(marker);
    };

    const svgCanvas = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); Object.assign(svgCanvas.style, { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9800, pointerEvents: 'none' }); container.appendChild(svgCanvas);
    const occupiedRects = [parentElement.getBoundingClientRect()];
    const isRectFree = (rect, occupied) => !occupied.some(o => !(rect.right < o.left || rect.left > o.right || rect.bottom < o.top || rect.top > o.bottom));
    const mainLegend = document.createElement('div'); Object.assign(mainLegend.style, { position: 'fixed', backgroundColor: 'rgba(22,22,25,0.9)', color: '#EFEFEF', border: '1px solid #555', borderRadius: '8px', padding: '10px 15px', zIndex: 10000, fontFamily: 'sans-serif', fontSize: '12px', maxHeight: '90vh', maxWidth: '400px', overflowY: 'auto' });
    let legendHtml = '<h3 style="margin:0 0 10px 0; padding-bottom:10px; border-bottom:1px solid #444;">Element Legend</h3>';
    allElementsData.forEach(item => { legendHtml += `<div style="display:flex;align-items:center;margin-bottom:4px;"><span style="font-weight:bold;min-width:25px;">${item.id}.</span><span style="width:12px;height:12px;background-color:${item.color};border-radius:3px;margin-right:8px;"></span><code style="background-color:#333;padding:1px 4px;border-radius:3px;">${item.descriptor}</code></div>`; });
    mainLegend.innerHTML = legendHtml; container.appendChild(mainLegend);

    let placedLegend = false;
    outerScan: for (let y = PANEL_MARGIN; y <= window.innerHeight - mainLegend.offsetHeight - PANEL_MARGIN; y += PANEL_STEP) {
        for (let x = PANEL_MARGIN; x <= window.innerWidth - mainLegend.offsetWidth - PANEL_MARGIN; x += PANEL_STEP) {
            const testRect = { top: y, left: x, right: x + mainLegend.offsetWidth, bottom: y + mainLegend.offsetHeight };
            if (isRectFree(testRect, occupiedRects)) { mainLegend.style.top = `${y}px`; mainLegend.style.left = `${x}px`; occupiedRects.push({ top: testRect.top - PANEL_MARGIN, left: testRect.left - PANEL_MARGIN, right: testRect.right + PANEL_MARGIN, bottom: testRect.bottom + PANEL_MARGIN }); placedLegend = true; break outerScan; }
        }
    }

    if (!placedLegend) {
        mainLegend.style.display = 'none';
        let legendForClipboard = '\\`\\`\\`\\n# AI CONTEXT: ELEMENT LEGEND\\n(Visual placement failed due to target size)\\n\\n';
        allElementsData.forEach(item => { legendForClipboard += `${item.id}. \`${item.descriptor}\`\\n`; });
        legendForClipboard += '\\`\\`\\`';
        const ta = document.createElement('textarea'); ta.style.position='fixed'; ta.style.opacity=0; ta.value=legendForClipboard.trim(); document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
        alert('Could not place the Element Legend without overlapping the target.\\n\\nThe legend has been copied to your clipboard instead.');
    }

    const panelsToDrawLinesTo = []; const queue = [...groups];
    while (queue.length > 0) {
        const group = queue.shift(); createGroupMarker(group);
        const panel = document.createElement('div'); Object.assign(panel.style, { position: 'fixed', backgroundColor: 'rgba(22,22,25,0.9)', border: '1px solid #555', borderRadius: '8px', padding: '10px', zIndex: 9900, fontFamily: 'sans-serif', fontSize: '12px', maxHeight: '40vh', overflowY: 'auto' });
        let keyHtml = `<h4 style="margin:0 0 5px 0; padding-bottom:5px;border-bottom:1px solid #444;color:white;font-size:12px;">Group g${group.id} (${group.members.length})</h4>`;
        group.members.sort((a, b) => a.id - b.id).forEach(data => { keyHtml += `<div style="display:flex;align-items:center;margin-bottom:4px;"><span style="font-weight:bold;min-width:25px;color:white;">${data.id}.</span><span style="width:12px;height:12px;background-color:${data.color};border-radius:3px;margin-right:8px;"></span><code style="background-color:#333;color:#EFEFEF;padding:1px 4px;border-radius:3px;">${data.descriptor}</code></div>`; });
        panel.innerHTML = keyHtml; container.appendChild(panel);
        let placedGroup = false;
        outerGroup: for (let y = PANEL_MARGIN; y <= window.innerHeight - panel.offsetHeight - PANEL_MARGIN; y += PANEL_STEP) {
            for (let x = PANEL_MARGIN; x <= window.innerWidth - panel.offsetWidth - PANEL_MARGIN; x += PANEL_STEP) {
                const testRect = { top: y, left: x, right: x + panel.offsetWidth, bottom: y + panel.offsetHeight };
                if (isRectFree(testRect, occupiedRects)) { panel.style.top = `${y}px`; panel.style.left = `${x}px`; occupiedRects.push(testRect); panelsToDrawLinesTo.push({ panel, group, center: { x: group.members.reduce((sum, d) => sum + d.center.x, 0) / group.members.length, y: group.members.reduce((sum, d) => sum + d.center.y, 0) / group.members.length } }); placedGroup = true; break outerGroup; }
            }
        }
        if (!placedGroup) {
            panel.remove();
            if (group.members.length > 1) {
                const half = Math.ceil(group.members.length / 2);
                queue.unshift({ id: `${group.id}b`, members: group.members.slice(half) });
                queue.unshift({ id: `${group.id}a`, members: group.members.slice(0, half) });
            }
        }
    }

    setTimeout(() => {
        panelsToDrawLinesTo.forEach(p => {
            const keyRect = p.panel.getBoundingClientRect(); const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', p.center.x); line.setAttribute('y1', p.center.y);
            line.setAttribute('x2', keyRect.left + keyRect.width / 2); line.setAttribute('y2', keyRect.top + keyRect.height / 2);
            line.setAttribute('stroke', 'white'); line.setAttribute('stroke-width', '2'); line.setAttribute('stroke-dasharray', '4'); line.setAttribute('stroke-opacity', '0.8'); svgCanvas.appendChild(line);
        });
        if (placedLegend && mainLegend.scrollHeight > window.innerHeight * 0.8 && window.innerWidth > 1000) { mainLegend.style.columnCount = 2; mainLegend.style.columnGap = '20px'; }
    }, 50);

    return `Visualizing ${allElementsData.length} elements (${groups.length} groups).`;
};


// --- Event Handlers ---

goButton.addEventListener('click', () => {
    const selector = selectorInput.value.trim();
    if (!selector) {
        statusMessage.textContent = 'Error: Please enter a selector.';
        statusMessage.style.color = 'red';
        return;
    }
    statusMessage.textContent = 'Processing with inheritance model...';
    statusMessage.style.color = '#555';
    chrome.devtools.inspectedWindow.eval(
        `(${getElementData.toString()})('${selector.replace(/'/g, "\\'")}')`,
        (report, isException) => {
            if (isException || (typeof report === 'string' && report.startsWith('ERROR:'))) {
                statusMessage.textContent = isException ? 'An unexpected error occurred.' : report;
                statusMessage.style.color = 'red';
                return;
            }
            copyToClipboard(report, "Inheritance-based context");
        }
    );
});

stripButton.addEventListener('click', () => {
    statusMessage.textContent = 'Stripping and copying full page HTML...';
    statusMessage.style.color = '#555';
    chrome.devtools.inspectedWindow.eval(
        `(${getAndStripHtml.toString()})()`,
        (report, isException) => {
            if (isException) {
                statusMessage.textContent = 'An unexpected error occurred.';
                statusMessage.style.color = 'red';
                return;
            }
            copyToClipboard(report, "Stripped HTML");
        }
    );
});

visualizeButton.addEventListener('click', () => {
    statusMessage.textContent = 'Generating visualization...';
    statusMessage.style.color = '#555';
    chrome.devtools.inspectedWindow.eval(
        `(${visualizeAndAnalyze.toString()})()`,
        (result, isException) => {
            if (isException || (typeof result === 'string' && result.startsWith('Error:'))) {
                statusMessage.textContent = isException ? 'An unexpected error occurred.' : result;
                statusMessage.style.color = 'red';
            } else {
                statusMessage.textContent = result;
                statusMessage.style.color = '#03A9F4';
            }
        }
    );
});

clearButton.addEventListener('click', () => {
    chrome.devtools.inspectedWindow.eval(
        `(${clearAiVisualization.toString()})()`,
        (result, isException) => {
            statusMessage.textContent = result;
            statusMessage.style.color = 'orange';
        }
    );
});
