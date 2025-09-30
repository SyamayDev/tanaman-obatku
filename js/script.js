document.addEventListener("DOMContentLoaded", function () {
  let tanamanData = [];
  let currentData = []; // Data yang sedang ditampilkan
  let listening = false;
  let page = 1;
  const itemsPerPage = 15; // Tampilkan 15 item per halaman
  let isLoading = false;

  // Ambil elemen dari DOM
  const searchInput = document.getElementById("searchInput");
  const resultsContainer = document.getElementById("results");
  const searchLabel = document.getElementById("search-label");
  const voiceSearchBtn = document.getElementById("voiceSearchBtn");
  const refreshBtn = document.getElementById("refreshBtn");
  const searchContainer = document.querySelector(".search-container");

  // Fungsi untuk memfilter dan menampilkan hasil
  function handleSearch() {
    window.removeEventListener("scroll", handleScroll);
    const query = searchInput.value.toLowerCase();

    if (query) {
      currentData = tanamanData.filter(
        (item) =>
          item.nama.toLowerCase().includes(query) ||
          item.input.toLowerCase().includes(query) ||
          item.proses.toLowerCase().includes(query) ||
          item.output.toLowerCase().includes(query)
      );
      resultsContainer.innerHTML = ""; // Kosongkan untuk pencarian baru
      page = 1;
      displayResults(currentData);
    } else {
      resetToInitialView();
    }
  }

  function displayResults(data) {
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const itemsToDisplay = data.slice(start, end);

    if (itemsToDisplay.length === 0 && start === 0) {
      resultsContainer.innerHTML = `<p class="text-center text-muted col-12 mt-4">Tanaman tidak ditemukan.</p>`;
      return;
    }

    itemsToDisplay.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'col-12 col-md-6 col-lg-4';
      card.innerHTML = `
        <div class="card herbal-card" data-no="${item.no}">
          <img src="${item.gambar}" class="card-img-top" alt="${item.nama}">
          <div class="card-body">
            <h5 class="card-title">${item.nama}</h5>
            <p class="card-text"><strong>Bagian Digunakan:</strong> ${item.input}</p>
            <p class="card-text"><strong>Cara Pengolahan:</strong> ${item.proses}</p>
            <p class="card-text"><strong>Khasiat:</strong> ${item.output}</p>
          </div>
        </div>
      `;
      card.querySelector('.herbal-card').addEventListener('click', () => {
        window.location.href = `detail.html?no=${item.no}`;
      });
      resultsContainer.appendChild(card);
    });
  }

  // Event listener untuk input ketikan
  searchInput.addEventListener("input", () => {
    if (searchInput.value.length === 0) {
      searchLabel.classList.remove("hidden");
    } else {
      searchLabel.classList.add("hidden");
    }
    handleSearch();
  });

  // --- Logika untuk Pencarian Suara ---
  const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;

  if (SpeechRecognition) {
    voiceSearchBtn.classList.add("show");

    voiceSearchBtn.addEventListener("click", () => {
      if (listening) return; // Cegah multiple start

      const recognition = new SpeechRecognition();
      recognition.lang = 'id-ID';
      recognition.continuous = false;
      recognition.interimResults = true;

      let voicePopup = document.createElement("div");
      voicePopup.className = "voice-popup";
      voicePopup.innerHTML = "<p>Mendengarkan...</p>";
      document.body.appendChild(voicePopup);

      recognition.onstart = () => {
        listening = true;
        voiceSearchBtn.classList.add('active');
      };

      recognition.onresult = (event) => {
        const interimTranscript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        voicePopup.innerHTML = `<p>${interimTranscript || 'Mendengarkan...'}</p>`;
        if (event.results[0].isFinal) {
          searchInput.value = event.results[0][0].transcript;
          searchInput.dispatchEvent(new Event("input", { bubbles: true }));
          closePopup();
        }
      };

      recognition.onend = () => {
        if (voicePopup.innerHTML.includes('Mendengarkan...')) {
          voicePopup.innerHTML = "<p>Tidak ada suara terdeteksi</p>";
          setTimeout(closePopup, 1500);
        }
        listening = false;
        voiceSearchBtn.classList.remove('active');
      };

      recognition.onerror = (event) => {
        voicePopup.innerHTML = `<p>Error: ${event.error}</p>`;
        setTimeout(closePopup, 1500);
        console.error('Voice recognition error:', event.error);
        listening = false;
        voiceSearchBtn.classList.remove('active');
      };

      recognition.start();

      function closePopup() {
        if (voicePopup) voicePopup.remove();
      }
    });
  }

  // --- Logika untuk Sticky Search Header ---
  if (searchContainer) {
    const placeholder = document.createElement("div");
    placeholder.classList.add("search-placeholder");
    searchContainer.after(placeholder);

    const triggerPoint = searchContainer.offsetTop;

    window.addEventListener("scroll", () => {
      if (window.scrollY > triggerPoint) {
        if (!searchContainer.classList.contains("is-sticky")) {
          placeholder.style.height = `${searchContainer.offsetHeight}px`;
          searchContainer.classList.add("is-sticky");
        }
      } else {
        if (searchContainer.classList.contains("is-sticky")) {
          searchContainer.classList.remove("is-sticky");
          placeholder.style.height = "0px";
        }
      }
    });
  }

  // --- Logika untuk Infinite Scroll ke Bawah ---
  function loadMoreItems() {
    if (isLoading) return;
    isLoading = true;

    const start = page * itemsPerPage;
    const end = start + itemsPerPage;
    const itemsToDisplay = currentData.slice(start, end);

    if (itemsToDisplay.length > 0) {
      displayResults(currentData);
      page++;
    } else {
      window.removeEventListener("scroll", handleScroll);
    }

    isLoading = false;
  }

  function handleScroll() {
    if (
      window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 200 &&
      !isLoading &&
      page * itemsPerPage < currentData.length
    ) {
      loadMoreItems();
    }
  }

  function resetToInitialView() {
    resultsContainer.innerHTML = "";
    page = 1;
    currentData = tanamanData;
    displayResults(currentData);
    window.addEventListener("scroll", handleScroll);
  }

  // --- Logika untuk Tombol Refresh ---
  refreshBtn.addEventListener("click", () => {
    location.reload();
  });

  // Muat data dari JSON
  fetch("data.json")
    .then((response) => {
      if (!response.ok) throw new Error("Gagal memuat data.json");
      return response.json();
    })
    .then((data) => {
      tanamanData = data;
      resetToInitialView();
    })
    .catch((error) => {
      console.error("Error:", error);
      resultsContainer.innerHTML = `<p class="text-center text-danger col-12 mt-4">Tidak dapat memuat data tanaman.</p>`;
    });

  window.addEventListener("scroll", handleScroll);
});