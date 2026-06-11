document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    const lessonList = document.getElementById('lesson-list');
    const lessonContent = document.getElementById('lesson-content');
    const mainContentArea = document.getElementById('main-content');
    const progressBar = document.getElementById('progress-bar');
    const searchInput = document.getElementById('search-input');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    // --- DARK MODE TOGGLE ---
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        body.classList.replace('light-mode', 'dark-mode');
        themeToggle.innerHTML = '<span class="icon">☀️</span> Modo Claro';
    }

    themeToggle.addEventListener('click', () => {
        if (body.classList.contains('light-mode')) {
            body.classList.replace('light-mode', 'dark-mode');
            themeToggle.innerHTML = '<span class="icon">☀️</span> Modo Claro';
            localStorage.setItem('theme', 'dark');
        } else {
            body.classList.replace('dark-mode', 'light-mode');
            themeToggle.innerHTML = '<span class="icon">🌓</span> Modo Escuro';
            localStorage.setItem('theme', 'light');
        }
    });

    // --- MOBILE MENU TOGGLE ---
    function toggleSidebar() {
        sidebar.classList.toggle('active');
        sidebarOverlay.classList.toggle('active');
    }

    if(mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', toggleSidebar);
    }
    if(sidebarOverlay) {
        sidebarOverlay.addEventListener('click', toggleSidebar);
    }

    // --- INIT ---
    if (typeof lessonsData !== 'undefined') {
        renderSidebar(lessonsData);
    } else {
        lessonContent.innerHTML = '<div class="topic-card"><p style="color:red;">Erro ao carregar conteúdo. Verifique se o arquivo conteudo.js existe e está incluído no HTML.</p></div>';
    }

    // --- RENDER SIDEBAR ---
    function renderSidebar(data) {
        lessonList.innerHTML = '';
        data.forEach((lesson, index) => {
            const li = document.createElement('li');
            li.textContent = lesson.titulo;
            li.dataset.index = index;
            
            if (lesson.bloqueada) {
                li.classList.add('locked');
                li.addEventListener('click', () => showLockedMessage(lesson.titulo, index));
            } else {
                li.addEventListener('click', () => selectLesson(index, data));
            }
            
            lessonList.appendChild(li);
        });
    }

    // --- SHOW LOCKED MESSAGE ---
    function showLockedMessage(titulo, index) {
        // Update active class
        const items = lessonList.querySelectorAll('li');
        items.forEach(item => item.classList.remove('active'));
        if(items[index]) items[index].classList.add('active');

        // Hide welcome message
        document.querySelector('.welcome-screen').style.display = 'none';

        // Close sidebar on mobile
        if (sidebar.classList.contains('active')) {
            toggleSidebar();
        }

        lessonContent.innerHTML = `
            <div class="topic-card" style="text-align: center; margin-top: 2rem;">
                <h2 style="font-size: 3rem; margin-bottom: 1rem;">🔒</h2>
                <h3 style="font-size: 2rem; color: var(--text-color); margin-bottom: 1rem;">Em breve!</h3>
                <p class="content-paragraph" style="color: var(--text-muted);">
                    A aula <strong>${titulo}</strong> ainda não foi liberada pelo professor. <br/>
                    Aguarde as próximas aulas para desbloquear este conteúdo.
                </p>
            </div>
        `;
        mainContentArea.scrollTop = 0; 
        updateProgress();
    }

    // --- SELECT LESSON ---
    function selectLesson(index, data = lessonsData) {
        // Update active class
        const items = lessonList.querySelectorAll('li');
        items.forEach(item => item.classList.remove('active'));
        if(items[index]) items[index].classList.add('active');

        // Hide welcome message
        document.querySelector('.welcome-screen').style.display = 'none';

        // Close sidebar on mobile
        if (sidebar.classList.contains('active')) {
            toggleSidebar();
        }

        const lesson = data[index];
        let html = `<h2 class="lesson-title">${lesson.titulo}</h2>`;
        
        let inTopicCard = false;
        let animationDelay = 0;

        function parseMarkdown(text) {
            if (!text) return '';
            return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        }

        // Se a aula não começar com subtítulo, criamos um card "Introdução" invisível
        if (lesson.conteudo.length > 0 && lesson.conteudo[0].tipo !== 'subtitulo') {
            html += `<div class="topic-card" style="animation-delay: ${animationDelay}s">`;
            inTopicCard = true;
            animationDelay += 0.1;
        }

        lesson.conteudo.forEach((block, i) => {
            if (block.tipo === 'subtitulo') {
                // Fecha o card anterior, se existir
                if (inTopicCard) {
                    html += `</div>`;
                }
                // Abre um novo card
                html += `<div class="topic-card" style="animation-delay: ${animationDelay}s">
                            <h3 class="topic-title">${parseMarkdown(block.texto)}</h3>`;
                inTopicCard = true;
                animationDelay += 0.1;
            } 
            else if (block.tipo === 'paragrafo') {
                html += `<p class="content-paragraph">${parseMarkdown(block.texto)}</p>`;
            } 
            else if (block.tipo === 'lista') {
                html += `<ul class="content-list">`;
                block.itens.forEach(item => {
                    html += `<li>${parseMarkdown(item)}</li>`;
                });
                html += `</ul>`;
            }
            else if (block.tipo === 'colunas') {
                html += `<div class="content-columns">`;
                block.colunas.forEach(col => {
                    html += `<div class="column-item">
                                <h4>${parseMarkdown(col.titulo)}</h4>
                                <p>${parseMarkdown(col.texto)}</p>
                             </div>`;
                });
                html += `</div>`;
            }
            else if (block.tipo === 'imagem') {
                if (block.src) {
                    html += `<img src="${block.src}" alt="Ilustração da aula" class="lesson-image" />`;
                } else {
                    html += `<div class="image-placeholder">${parseMarkdown(block.texto)}</div>`;
                }
            } 
            else if (block.tipo === 'quiz') {
                if (inTopicCard) {
                    html += `</div>`;
                    inTopicCard = false;
                }
                html += `
                    <div class="quiz-section">
                        <h3>${block.texto}</h3>
                        <p>Acesse o link abaixo para resolver os exercícios e testar seus conhecimentos sobre a matéria.</p>
                        <a href="${block.link}" target="_blank" class="quiz-btn">Fazer Quiz no Wayground</a>
                    </div>
                `;
            }
        });

        // Fecha a última div pendente
        if (inTopicCard) {
            html += `</div>`;
        }

        lessonContent.innerHTML = html;
        mainContentArea.scrollTop = 0; 
        updateProgress(); 
    }

    // --- READING PROGRESS BAR ---
    mainContentArea.addEventListener('scroll', updateProgress);
    
    function updateProgress() {
        const scrollTop = mainContentArea.scrollTop;
        const scrollHeight = mainContentArea.scrollHeight - mainContentArea.clientHeight;
        const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
        progressBar.style.width = `${progress}%`;
    }

    // --- SEARCH FUNCTIONALITY ---
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        
        if (!query) {
            renderSidebar(lessonsData);
            return;
        }

        const filteredData = lessonsData.filter(lesson => {
            const titleMatch = lesson.titulo.toLowerCase().includes(query);
            const contentMatch = lesson.conteudo.some(block => 
                (block.tipo === 'paragrafo' || block.tipo === 'subtitulo') && 
                block.texto.toLowerCase().includes(query)
            );
            return titleMatch || contentMatch;
        });

        renderSidebar(filteredData);
    });
});
