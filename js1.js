// const API_KEY = "0835A204F9BFD3CF177930A9DFA356F7";
// `https://store.steampowered.com/api/appdetails?appids=${appId}`;
// "https://api.steampowered.com/ISteamApps/GetAppList/v2/";




// YouTube --------------
document.addEventListener("DOMContentLoaded", function () {
  // URL에서 검색어를 가져오는 함수
  function getSearchQuery() {
    const params = new URLSearchParams(window.location.search);
    return params.get("search"); // URL의 'search' 파라미터 값을 가져옵니다.
  }

  // YouTube 동영상을 iframe에 로드하는 함수
  function loadYouTubeIframes(videos) {
    if (videos.length > 0) {
      const iframe1 = document.querySelector("#youtubeIframe1");
      iframe1.src = `https://www.youtube.com/embed/${videos[0].id.videoId}`;
      if (videos[1]) {
        const iframe2 = document.querySelector("#youtubeIframe2");
        iframe2.src = `https://www.youtube.com/embed/${videos[1].id.videoId}`;
      }
    }
  }

  // YouTube API 키
  const apiKey = "AIzaSyAMZvIh6UDUmKGYgtWLD1NqddaCstv9YNI"; // 여기에 실제 API 키를 넣으세요.

  // YouTube 동영상을 가져오는 함수
  async function fetchYouTubeVideos(youTubeGameName) {
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&q=${encodeURIComponent(
          youTubeGameName
        )}&part=snippet&type=video&order=viewCount&maxResults=2` // regionCode를 추가
      );

      if (!response.ok) {
        throw new Error(
          "YouTube API request failed with status " + response.status
        );
      }

      const data = await response.json();
      return data.items;
    } catch (error) {
      console.error("Fetching YouTube videos failed:", error);
      throw error;
    }
  }

  // 메인 실행 함수
  async function main() {
    const youTubeGameName = getSearchQuery();

    if (!youTubeGameName) {
      console.error("No search query found.");
      return; // 검색어가 없으면 함수 종료
    }

    try {
      // YouTube 동영상을 가져옵니다.
      const videos = await fetchYouTubeVideos(youTubeGameName);
      loadYouTubeIframes(videos);
    } catch (error) {
      console.error("Failed to fetch and display YouTube videos:", error);
    }
  }

  main(); // 메인 함수 실행
});

// YouTube --------------

let steamGamesCache = null; // 게임 목록을 캐싱할 변수

// 1단계: 사용자가 입력한 게임 이름을 가져오기
function getSearchInput() {
  return document.querySelector("#gameSearchInput").value.trim();
}

// 2단계: 스팀 `getapplist` API를 사용하여 게임 목록을 가져오는 함수
async function fetchSteamGames() {
  if (steamGamesCache) {
    return steamGamesCache; // 캐시된 데이터가 있다면, 네트워크 요청 없이 반환
  }
  try {
    const response = await fetch(
      "https://api.steampowered.com/ISteamApps/GetAppList/v2/"
    );
    if (!response.ok) {
      throw new Error("Network response was not ok.");
    }
    const data = await response.json();
    steamGamesCache = data.applist.apps; // 응답을 캐시합니다.
    return steamGamesCache;
  } catch (error) {
    console.error("Fetching Steam games failed:", error);
    throw error; // 에러를 다시 발생시켜 호출자에게 알립니다.
  }
}

// URL에서 검색어 파라미터를 가져옵니다.
const urlParams = new URLSearchParams(window.location.search);
const searchKeyword = urlParams.get("search");

// 검색어가 있을 경우에만 게임 상세 정보 표시를 수행합니다.
if (searchKeyword) {
  findGameInSteamList(searchKeyword);
}

// fetchSteamGames 함수를 사용하여 게임 목록을 가져오고, 게임 이름과 매칭되는 appid를 찾습니다.
async function findGameInSteamList(searchedGameName) {
  try {
    const gamesList = await fetchSteamGames();
    const trimmedSearchedGameName = searchedGameName.trim().toLowerCase();

    const foundGame = gamesList.find((game) => {
      const trimmedGameName = game.name.trim().toLowerCase();
      return trimmedGameName === trimmedSearchedGameName;
    });

    if (foundGame) {
      // foundGame.appid를 사용하여 게임 상세 정보를 가져옵니다.
      displayGameDetails(foundGame.appid);
    } else {
      console.log("게임을 찾을 수 없음");
    }
  } catch (error) {
    console.error("게임 검색 중 오류 발생:", error);
  }
}

// 이하 displayGameDetails와 fetchSteamGames 함수는 이미 존재하는 코드를 사용합니다.

function isDuplicateGame(searches, game) {
  return searches.some((searchedGame) => searchedGame.appid === game.appid);
}

// 로컬 스토리지에 검색된 게임 목록 저장하기
function saveToLocalStorage(
  appid,
  name,
  genresArray,
  header_image,
  release_date,
  screenshotsArray // 스크린샷 배열을 매개변수로 추가합니다.
) {
  const storageKey = "searchedGames";
  try {
    let searches = JSON.parse(localStorage.getItem(storageKey)) || [];
    let gameIndex = searches.findIndex((item) => item.appid === appid);

    if (gameIndex !== -1) {
      // 이미 존재하는 게임이면 조회수를 증가시킵니다.
      searches[gameIndex].count += 1;
      // 장르, 헤더 이미지, 출시일, 스크린샷 정보를 업데이트합니다.
      searches[gameIndex].genres = genresArray;
      searches[gameIndex].header_image = header_image;
      searches[gameIndex].release_date = release_date.date;
      searches[gameIndex].screenshot =
        screenshotsArray.length > 0 ? screenshotsArray[0].path_thumbnail : ""; // 첫 번째 스크린샷의 썸네일 경로를 저장합니다.
    } else {
      // 새 게임이면 목록에 추가합니다.
      searches.unshift({
        appid: appid,
        name: name,
        count: 1,
        genres: genresArray,
        header_image: header_image,
        release_date: release_date.date,
        screenshot:
          screenshotsArray.length > 0 ? screenshotsArray[0].path_thumbnail : "", // 첫 번째 스크린샷의 썸네일 경로를 저장합니다.
      });
      // 로컬 스토리지에 저장된 데이터가 100개 이상이면, 가장 오래된 데이터를 제거합니다.
      if (searches.length > 100) {
        searches.pop();
      }
    }

    // 로컬 스토리지에 저장된 데이터 갱신
    localStorage.setItem(storageKey, JSON.stringify(searches));
  } catch (e) {
    console.error("LocalStorage에 데이터를 저장하는데 문제가 발생했습니다.", e);
  }
}

// 스팀 `GetAppList` API를 사용하여 게임의 상세 정보를 가져오는 함수
async function fetchGameDetails(appid) {
  try {
    const response = await fetch(
      `https://store.steampowered.com/api/appdetails?appids=${appid}`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch game details for appid ${appid}`);
    }

    const data = await response.json();

    // appid에 해당하는 게임 데이터가 있는지 확인
    if (data && data[appid] && data[appid].success) {
      const gameData = data[appid].data;
      return gameData;
    } else {
      throw new Error(`Game details not found for appid ${appid}`);
    }
  } catch (error) {
    console.error(`An error occurred while fetching game details: ${error}`);
    return null;
  }
}

// handleSearch 함수 내부
async function handleSearch(event) {
  event.preventDefault(); // 폼 제출 기본 이벤트를 방지합니다.
  const gameName = getSearchInput(); // 사용자 입력을 가져옵니다.

  if (!gameName) {
    alert("게임 이름을 입력해주세요.");
    return; // 함수를 여기서 종료시킵니다.
  }

  // 검색 페이지로 이동하면서 검색어를 전달합니다.
  window.location.href = `search.html?search=${encodeURIComponent(gameName)}`;
}

// 이벤트 리스너 추가
document
  .getElementById("gameSearchForm")
  .addEventListener("submit", handleSearch);

//서치페이지
async function displayGameDetails(appid) {
  try {
    const gameDetails = await fetchGameDetails(appid);
    if (gameDetails) {
      // 이미지 및 기타 게임 정보 업데이트

      const searchTotal = document.querySelector(".search-total");
      if (gameDetails.recommendations && gameDetails.recommendations.total) {
        searchTotal.textContent = gameDetails.recommendations.total;
      } else {
        searchTotal.textContent = "출시예정";
      }
      const searchPricew = document.querySelector(".search-pricew");
      if (gameDetails.price_overview?.initial_formatted) {
        searchPricew.textContent = gameDetails.price_overview.initial_formatted;
      } else {
        searchPricew.style.display = "none";
      }
      const searchPrice = document.querySelector(".search-price");
      if (gameDetails.price_overview?.final_formatted) {
        searchPrice.textContent = gameDetails.price_overview.final_formatted;
      } else {
        searchPrice.textContent = "Free";
      }
      document.querySelector(".search-data").textContent =
        gameDetails.release_date.date;
      let genresArray = [];
      if (gameDetails.genres && gameDetails.genres.length > 0) {
        genresArray = gameDetails.genres.map((genre) => genre.description);
      }
      const gameGenres = document.querySelector(".search-genres");

      if (gameDetails.genres && gameDetails.genres.length > 0) {
        const genresText = gameDetails.genres
          .map((genre) => genre.description)
          .slice(0, 3)
          .join(", ");

        gameGenres.textContent = genresText;
      } else {
        gameGenres.style.display = "none";
      }
      const discountElement = document.querySelector(".search-discount");
      if (
        gameDetails.price_overview &&
        gameDetails.price_overview.discount_percent > 0
      ) {
        // 할인율이 있고 0보다 큰 경우 할인율을 표시합니다.
        discountElement.textContent = `${gameDetails.price_overview.discount_percent}% off`;
        discountElement.style.display = "block"; // 혹은 필요에 따라 다른 display 값으로 설정
      } else {
        // 할인율이 없거나 0인 경우 요소를 숨깁니다.
        discountElement.style.display = "none";
      }
      const gameName = gameDetails.name;
      const headerImage = gameDetails.header_image;
      const releaseDate = { date: gameDetails.release_date.date }; // 이미 객체 형태로 있어야 함
      document.querySelector(".search-name").textContent = gameDetails.name;
      document.querySelector(".search-headerimg").src =
        gameDetails.header_image;
      document.querySelector(".search-image1").src =
        gameDetails.screenshots[0].path_full;
      document.querySelector(".search-image2").src =
        gameDetails.screenshots[1].path_full;
      document.querySelector(".search-image3").src =
        gameDetails.screenshots[2].path_full;
      document.querySelector(".search-image4").src =
        gameDetails.screenshots[3].path_full;
      document.querySelector(".backgroundimg").src =
        gameDetails.screenshots[0].path_full;
      // 스크린샷 배열 추출
      let screenshotsArray = [];
      if (gameDetails.screenshots && gameDetails.screenshots.length > 0) {
        screenshotsArray = gameDetails.screenshots.map((screenshot) => ({
          path_thumbnail: screenshot.path_thumbnail, // 썸네일 경로
          path_full: screenshot.path_full, // 전체 이미지 경로
        }));
      }

      // 로컬 스토리지에 게임 정보 저장
      saveToLocalStorage(
        appid,
        gameName,
        genresArray,
        headerImage,
        releaseDate,
        screenshotsArray // 스크린샷 배열을 추가
      );

      // 비디오 업데이트
      const videoElement = document.querySelector(".search-video"); // 비디오 요소 선택

      // 현재 비디오 소스들을 제거
      while (videoElement.firstChild) {
        videoElement.removeChild(videoElement.firstChild);
      }

      // 새 비디오 요소 생성
      if (gameDetails.movies && gameDetails.movies.length > 0) {
        videoElement.width = 640;
        videoElement.controls = true;
        videoElement.autoplay = true;
        videoElement.muted = true; // 브라우저의 자동 재생 정책을 준수하기 위해 음소거

        const videoSource = document.createElement("source");
        videoSource.src = gameDetails.movies[0].webm.max;
        videoSource.type = "video/webm";

        videoElement.appendChild(videoSource);

        videoElement.load(); // 새로운 비디오 소스를 로드
      }
    }
  } catch (error) {
    console.error("An error occurred while displaying game details:", error);
  }
}

// 검색 페이지 로딩시 검색 결과 표시

//   로그인 회원가입
document.addEventListener("DOMContentLoaded", function () {
  const link = document.querySelector("a[href='join.html']");

  if (link) {
    link.addEventListener("mouseover", function () {
      const icon = this.querySelector(".fa-gear");
      if (icon) {
        icon.classList.add("fa-spin", "fa-2x");
      }
    });

    link.addEventListener("mouseout", function () {
      const icon = this.querySelector(".fa-gear");
      if (icon) {
        icon.classList.remove("fa-spin", "fa-2x");
      }
    });
  }
});

// 이 함수를 로드 또는 특정 이벤트 시에 호출

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // 구조 분해 할당을 사용하여 요소를 교환
  }
}

function getTopTenAppIds() {
  try {
    const gamesString = localStorage.getItem("searchedGames");
    if (!gamesString) {
      console.error("No data found in storage.");
      return [];
    }

    const games = JSON.parse(gamesString);
    // 가져온 게임 배열이 유효한지 확인합니다.
    if (!Array.isArray(games)) {
      console.error("searchedGames is not an array");
      return [];
    }

    // count에 따라 게임을 정렬하고 상위 10개를 추출합니다.
    const topGames = games.sort((a, b) => b.count - a.count).slice(1, 11);

    // 추출된 게임들의 appid만 뽑아내어 배열로 만듭니다.
    const topAppIds = topGames.map((game) => game.appid);

    // appid 배열을 셔플합니다.
    shuffleArray(topAppIds);

    return topAppIds;
  } catch (e) {
    console.error("Error while getting top app IDs from localStorage:", e);
    return [];
  }
}

window.onload = function () {
  // 첫 번째 게임의 배경 이미지를 설정합니다.
  if (window.location.href.includes("news")) {
    const topGames1 = getTopGamesByCount(); // 게임 객체의 배열을 가져옵니다.

    // 첫 번째 게임의 배경 이미지를 설정합니다.
   if (topGames1.length > 0) {
     const firstGameScreenshot = topGames1[0].screenshot; // 첫 번째 게임의 스크린샷 이미지 URL
     const backgroundElement = document.querySelector(".backgroundimg1");
     if (backgroundElement) {
     backgroundElement.src = firstGameScreenshot;

     }
   }
    fetchNewsFromAPI().then((newsItems) => {
      displayNews(newsItems);
    });
  }
  getTopTenAppIds();
};

async function fetchNewsFromAPI() {
  // 뉴스를 가져오는 코드를 여기에 구현합니다.
  // 예시를 위해 빈 배열을 반환합니다.
  return [];
}
//메인 api 출력

if (window.location.pathname === "/myweb/index.html") {
  async function searchGameDetail() {
    const topAppIds = getTopTenAppIds();
    if (topAppIds.length === 0) {
      console.error("No top app IDs available.");
      return;
    }

    const gameDetails = await fetchGameDetails(topAppIds[1]);
    const miniDetails1 = await fetchGameDetails(topAppIds[2]);
    const miniDetails2 = await fetchGameDetails(topAppIds[3]);
    const miniDetails3 = await fetchGameDetails(topAppIds[4]);
    if (!gameDetails) {
      console.error("No game details available.");
      return;
    }

    // 해당하는 HTML 요소에 게임 정보를 설정합니다.
    document.querySelector(".game-title").textContent = gameDetails.name;
    document.querySelector(".mini-title1").textContent = miniDetails1.name;
    document.querySelector(
      ".mini-a1"
    ).href = `/myweb/search.html?search=${encodeURIComponent(
      miniDetails1.name
    )}`;
    document.querySelector(".mini-title2").textContent = miniDetails2.name;
    document.querySelector(
      ".mini-a2"
    ).href = `/myweb/search.html?search=${encodeURIComponent(
      miniDetails2.name
    )}`;
    document.querySelector(".mini-title3").textContent = miniDetails3.name;
    document.querySelector(
      ".mini-a3"
    ).href = `/myweb/search.html?search=${encodeURIComponent(
      miniDetails3.name
    )}`;
    document.querySelector(".game-image").src = gameDetails.header_image;

    //메인 title
    const gameTotal = document.querySelector(".game-total");
    if (gameDetails.recommendations && gameDetails.recommendations.total) {
      gameTotal.textContent = "추천수 " + gameDetails.recommendations.total;
    } else {
      gameTotal.textContent = "출시예정";
    }
    const pricewElement = document.querySelector(".game-pricew");
    if (gameDetails.price_overview?.initial_formatted) {
      pricewElement.textContent = gameDetails.price_overview.initial_formatted;
    } else {
      pricewElement.style.display = "none";
    }
    const priceElement = document.querySelector(".game-price");
    if (gameDetails.price_overview?.final_formatted) {
      priceElement.textContent = gameDetails.price_overview.final_formatted;
    } else {
      priceElement.textContent = "Free";
    }
    document.querySelector(".game-date").textContent =
      gameDetails.release_date.date;

    const gameGenres = document.querySelector(".game-genres");

    if (gameDetails.genres && gameDetails.genres.length > 0) {
      const genresText = gameDetails.genres
        .map((genre) => genre.description)
        .slice(0, 3)
        .join(", ");

      gameGenres.textContent = genresText;
    } else {
      gameGenres.style.display = "none";
    }
    const discountElement = document.querySelector(".game-discount");
    if (
      gameDetails.price_overview &&
      gameDetails.price_overview.discount_percent > 0
    ) {
      // 할인율이 있고 0보다 큰 경우 할인율을 표시합니다.
      discountElement.textContent = `${gameDetails.price_overview.discount_percent}% off`;
      discountElement.style.display = "block"; // 혹은 필요에 따라 다른 display 값으로 설정
    } else {
      // 할인율이 없거나 0인 경우 요소를 숨깁니다.
      discountElement.style.display = "none";
    }
    //  mini타이틀 3개

    // mini 게임이름
    document.querySelector(".mini-title1").textContent = miniDetails1.name;
    document.querySelector(".mini-title2").textContent = miniDetails2.name;
    document.querySelector(".mini-title3").textContent = miniDetails3.name;

    //mini 헤더이미지
    document.querySelector(".mini-image1").src = miniDetails1.header_image;
    document.querySelector(".mini-image2").src = miniDetails2.header_image;
    document.querySelector(".mini-image3").src = miniDetails3.header_image;

    // mini 추천수
    const minoTotal1 = document.querySelector(".mini-avg1");
    if (miniDetails1.recommendations && miniDetails1.recommendations.total) {
      minoTotal1.textContent = miniDetails1.recommendations.total;
    } else {
      minoTotal1.textContent = "출시예정";
    }
    const minoTotal2 = document.querySelector(".mini-avg2");
    if (miniDetails2.recommendations && miniDetails2.recommendations.total) {
      minoTotal2.textContent = miniDetails2.recommendations.total;
    } else {
      minoTotal2.textContent = "출시예정";
    }
    const minoTotal3 = document.querySelector(".mini-avg3");
    if (miniDetails3.recommendations && miniDetails3.recommendations.total) {
      minoTotal3.textContent = miniDetails3.recommendations.total;
    } else {
      minoTotal3.textContent = "출시예정";
    }

    //mini 장르
    const miniGenres1 = document.querySelector(".mini-genres1");

    if (miniDetails1.genres && miniDetails1.genres.length > 0) {
      const genresText1 = miniDetails1.genres
        .map((genre) => genre.description)
        .slice(0, 3)
        .join(", ");

      miniGenres1.textContent = genresText1;
    } else {
      miniGenres1.style.display = "none";
    }

    const miniGenres2 = document.querySelector(".mini-genres2");

    if (miniDetails2.genres && miniDetails2.genres.length > 0) {
      const genresText2 = miniDetails2.genres
        .map((genre) => genre.description)
        .slice(0, 3)
        .join(", ");

      miniGenres2.textContent = genresText2;
    } else {
      miniGenres2.style.display = "none";
    }
    const miniGenres3 = document.querySelector(".mini-genres3");

    if (miniDetails3.genres && miniDetails3.genres.length > 0) {
      const genresText3 = miniDetails3.genres
        .map((genre) => genre.description)
        .slice(0, 3)
        .join(", ");

      miniGenres3.textContent = genresText3;
    } else {
      miniGenres3.style.display = "none";
    }

    // 백그라운드 비디오 삽입
    const backgroundVideoElement = document.querySelector(".video-container");
    if (gameDetails.movies && gameDetails.movies.length > 0) {
      const backgroundVideoSource = document.createElement("source");
      backgroundVideoSource.src = gameDetails.movies[0].mp4.max;
      backgroundVideoSource.type = "video/mp4";
      backgroundVideoElement.appendChild(backgroundVideoSource);
      backgroundVideoElement.muted = true;
      backgroundVideoElement.load();
      backgroundVideoElement.autoplay = true;
      backgroundVideoElement.play();
      backgroundVideoElement.controls = true;
    } else {
      console.log("No background video available for this game.");
    }

    // 작은 게임 비디오 삽입
    const gameVideoElement = document.querySelector(".game-video");
    if (gameDetails.movies && gameDetails.movies.length > 0) {
      const gameVideoSource = document.createElement("source");
      gameVideoSource.src = gameDetails.movies[0].mp4.max;
      gameVideoSource.type = "video/mp4";
      gameVideoElement.appendChild(gameVideoSource);
      gameVideoElement.muted = true;
      gameVideoElement.load();
      gameVideoElement.autoplay = true;
      gameVideoElement.play();
      gameVideoElement.controls = true;
    } else {
      console.log("No game video available for this game.");
    }
  }

  // searchGameDetail 함수를 실행하여 게임 정보를 로드하고 표시합니다.
  searchGameDetail();

  function getGenresWithCountsFromLocalStorage() {
    const storageKey = "searchedGames";
    let games = JSON.parse(localStorage.getItem(storageKey)) || [];
    let genresMap = new Map();

    // 모든 게임의 장르를 순회하면서 Map에 저장합니다.
    games.forEach((game) => {
      if (game.genres) {
        game.genres.forEach((genre) => {
          if (genresMap.has(genre)) {
            // 이미 Map에 장르가 있다면, 카운트만 증가시킵니다.
            let count = genresMap.get(genre);
            genresMap.set(genre, count + 1);
          } else {
            // Map에 장르가 없다면, 장르를 추가하고 카운트를 1로 설정합니다.
            genresMap.set(genre, 1);
          }
        });
      }
    });

    // Map 객체를 배열로 변환하여 장르와 카운트를 포함합니다.
    let genresArray = [];
    genresMap.forEach((count, genre) => {
      genresArray.push({ genre: genre, count: count });
    });

    return genresArray;
  }

  // 로컬 스토리지에 장르와 카운트를 저장하는 함수입니다.
  function saveGenresWithCountsToLocalStorage() {
    const genresWithCounts = getGenresWithCountsFromLocalStorage();

    // 새로운 키를 만들어 장르와 카운트를 로컬 스토리지에 저장합니다.
    localStorage.setItem("genresWithCounts", JSON.stringify(genresWithCounts));
  }

  // 이 함수를 호출하면 로컬 스토리지에 'genresWithCounts'라는 키로 장르와 카운트가 저장됩니다.
  saveGenresWithCountsToLocalStorage();

  // 인기순위 게임을 화면에 표시하는 함수
  function showTopGames() {
    const games = JSON.parse(localStorage.getItem("searchedGames")) || [];
    const sortedGames = games.sort((a, b) => (b.count || 0) - (a.count || 0));
    const topGames = sortedGames.slice(0, 10);
    const gameListElement = document.getElementById("game-list");
    gameListElement.innerHTML = "";

    topGames.forEach((game) => {
      const gameElement = document.createElement("div");
      gameElement.classList.add("game-item11");

      // 링크를 생성합니다.
      const gameLink = document.createElement("a");
      gameLink.href = `/myweb/search.html?search=${encodeURIComponent(
        game.name
      )}`;
      gameLink.classList.add("game-link");

      // 이미지를 생성하고 링크로 감쌉니다.
      const gameImage = document.createElement("img");
      gameImage.src = game.header_image;
      gameImage.alt = `Cover image of ${game.name}`;
      gameImage.classList.add("game-image11");
      gameLink.appendChild(gameImage); // 이미지를 링크 안에 추가

      const gameInfo = document.createElement("div");
      gameInfo.classList.add("game-info");

      // 게임 이름을 텍스트로 하는 링크 요소
      const gameTitle = document.createElement("span"); // 'span'으로 변경하여 'a' 태그 안에 넣습니다.
      gameTitle.textContent = game.name;
      gameTitle.classList.add("game-title1");
      gameLink.appendChild(gameTitle); // 게임 제목을 링크 안에 추가

      // 출시일을 표시하고 링크로 감쌉니다.
      const gameReleaseDate = document.createElement("span"); // 'p' 대신 'span'을 사용하여 'a' 태그 안에 넣습니다.
      gameReleaseDate.textContent = `Release Date: ${game.release_date}`;
      gameReleaseDate.classList.add("game-release-date");
      gameLink.appendChild(gameReleaseDate); // 출시일을 링크 안에 추가

      // gameInfo에 gameLink를 추가합니다. (이미지와 게임 정보 모두 포함)
      gameInfo.appendChild(gameLink);

      // gameElement에 gameInfo를 추가합니다.
      gameElement.appendChild(gameInfo);

      // gameElement를 리스트에 추가합니다.
      gameListElement.appendChild(gameElement);
    });
  }
  function showGamesByGenre(genre) {
    const games = JSON.parse(localStorage.getItem("searchedGames")) || [];
    const filteredGames = games.filter(
      (game) => game.genres && game.genres.includes(genre)
    );
    const gameListElement = document.getElementById("game-list");
    gameListElement.innerHTML = "";

    filteredGames.forEach((game) => {
      const gameElement = document.createElement("div");
      gameElement.classList.add("game-item11");

      const gameLink = document.createElement("a");
      gameLink.href = `/myweb/search.html?search=${encodeURIComponent(
        game.name
      )}`;
      gameLink.classList.add("game-link");

      const gameImage = document.createElement("img");
      gameImage.src = game.header_image;
      gameImage.alt = `Cover image of ${game.name}`;
      gameImage.classList.add("game-image11");
      gameLink.appendChild(gameImage);

      const gameTitle = document.createElement("span");
      gameTitle.textContent = game.name;
      gameTitle.classList.add("game-title1");
      gameLink.appendChild(gameTitle);

      const gameReleaseDate = document.createElement("span");
      gameReleaseDate.textContent = `Release Date: ${game.release_date}`;
      gameReleaseDate.classList.add("game-release-date");
      gameLink.appendChild(gameReleaseDate);

      gameElement.appendChild(gameLink);
      gameListElement.appendChild(gameElement);
    });
  }

  // 버튼에 클릭 이벤트 리스너를 추가하는 함수
  function setupGenreButtons() {
    document.querySelectorAll(".genre-btn").forEach((button) => {
      button.addEventListener("click", function () {
        const genre = this.getAttribute("data-genre");
        if (genre === "인기순위10") {
          showTopGames();
        } else {
          showGamesByGenre(genre);
        }
      });
    });
  }

  // 페이지 로드 시 버튼 이벤트 리스너 설정
  document.addEventListener("DOMContentLoaded", setupGenreButtons);

  // 페이지 로드 시 인기순위 게임을 표시하고 버튼 이벤트 리스너를 설정하는 함수
  function initializePage() {
    showTopGames(); // 인기순위 게임을 기본으로 표시합니다.
    setupGenreButtons(); // 버튼에 클릭 이벤트 리스너를 추가합니다.
    setActiveButton("인기순위10"); // 인기순위 버튼을 활성화 상태로 설정합니다.
  }

  // 활성화된 버튼에 시각적 표시를 추가하는 함수
  function setActiveButton(genre) {
    // 모든 버튼의 'active' 클래스를 제거합니다.
    document.querySelectorAll(".genre-btn").forEach((button) => {
      button.classList.remove("active");
    });

    // 선택된 장르에 해당하는 버튼에만 'active' 클래스를 추가합니다.
    const activeButton = document.querySelector(
      `.genre-btn[data-genre="${genre}"]`
    );
    if (activeButton) {
      activeButton.classList.add("active");
    }
  }

  // 버튼에 클릭 이벤트 리스너를 추가하는 함수
  function setupGenreButtons() {
    document.querySelectorAll(".genre-btn").forEach((button) => {
      button.addEventListener("click", function () {
        const genre = this.getAttribute("data-genre");
        if (genre === "인기순위10") {
          showTopGames();
        } else {
          showGamesByGenre(genre);
        }
        setActiveButton(genre); // 클릭된 버튼을 활성화 상태로 설정합니다.
      });
    });
  }

  // 페이지 로드 시 초기화 함수 호출
  document.addEventListener("DOMContentLoaded", initializePage);
}

function getTopGamesByCount() {
  let games = JSON.parse(localStorage.getItem("searchedGames")) || [];
  games.sort((a, b) => b.count - a.count);

  // 상위 10개의 게임 정보를 반환하도록 수정합니다. 여기에서는 appid와 header_image를 반환합니다.
  return games.slice(0, 10).map((game) => {
    return {
      appid: game.appid,
      headerImage: game.header_image,
      screenshot: game.screenshot,
    };
  });
}

function getNewsForGames(games) {
  let newsPromises = games.map((game) => {
    let url = `https://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/?appid=${game.appid}&count=3&maxlength=300&format=json`;
    return fetch(url).then((response) => response.json());
  });

  return Promise.all(newsPromises);
}

// 상위 10개 게임의 뉴스 가져오기 및 표시
getNewsForGames(getTopGamesByCount()).then(displayNews);

let currentPage = 1;
const newsPerPage = 10; // 한 페이지에 표시할 뉴스의 수
let allNews = []; // 모든 뉴스를 저장할 배열

// 전체 뉴스 데이터를 페이지 별로 나누는 함수
function paginateNews(page) {
  const start = (page - 1) * newsPerPage;
  const end = page * newsPerPage;
  return allNews.slice(start, end);
}

// 뉴스를 표시하는 함수 (페이징 적용)
function displayNews(newsItems) {
  const newsContainer = document.querySelector(".steam-news-container");
  if (!newsContainer) return; // .steam-news-container가 없다면 종료

  newsContainer.innerHTML = "";

  // `newsItems`는 `appnews` 객체를 포함할 것으로 예상됩니다.
  newsItems.forEach((data) => {
    if (data.appnews && data.appnews.newsitems.length > 0) {
      // 첫 번째 뉴스 아이템만 처리하고 있습니다.
      const newsItem = data.appnews.newsitems[0];

      const title = newsItem.title || "No title";
      const contents = newsItem.contents || "No content available";
      const url = newsItem.url || "#";

      const newsElement = document.createElement("div");
      newsElement.className = "news-item";
      newsElement.innerHTML = `
        <h2 class="news-title">${title}</h2>
        <p class="news-content">${contents}</p>
        <a href="${url}" class="news-link" target="_blank">Read more</a>
      `;
      newsContainer.appendChild(newsElement);
    }
  });
}

// 페이지 버튼을 클릭했을 때 호출되는 함수
function goToPage(pageNumber) {
  currentPage = pageNumber;
  const paginatedNews = paginateNews(currentPage);
  displayNews(paginatedNews);
}

// 페이징 버튼을 생성하는 함수
function createPagination(totalPages, currentPage) {
  const paginationContainer = document.querySelector(".pagination-container");

  if (!paginationContainer) {
    console.error("Pagination container element not found!");
    return;
  }

  let buttonsHTML = "";
  for (let i = 1; i <= totalPages; i++) {
    buttonsHTML += `<button class="page-btn${
      i === currentPage ? " active" : ""
    }" data-page="${i}">${i}</button>`;
  }

  paginationContainer.innerHTML = buttonsHTML;

  // 페이지 버튼에 대한 클릭 이벤트 핸들러를 설정합니다.
  const pageButtons = paginationContainer.querySelectorAll(".page-btn");
  pageButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const page = parseInt(this.dataset.page, 10);
      displayNews(paginateNews(page)); // 여기서 'displayNews'와 'paginateNews' 함수를 호출해야 합니다.
    });
  });
}
function getTopGamesByCount() {
  let games = JSON.parse(localStorage.getItem("searchedGames")) || [];
  games.sort((a, b) => b.count - a.count);

  // 상위 10개의 게임 정보를 반환하도록 수정합니다. 여기에서는 appid와 header_image를 반환합니다.
  return games.slice(0, 10).map((game) => {
    return {
      appid: game.appid,
      headerImage: game.header_image,
      screenshot: game.screenshot,
    };
  });
}
document.addEventListener("DOMContentLoaded", (event) => {
 
  // 로그인 모달 요소
  var modal = document.getElementById("loginModal");
  var btn = document.getElementById("loginBtn");
  var span = document.getElementsByClassName("close")[0];
  var loginForm = document.getElementById("loginForm");

  // 회원가입 모달 요소
  var signupModal = document.getElementById("signupModal");
  var signupBtn = document.getElementById("signupBtn");
  var signupSpan = document.getElementById("signupClose");
  var signupForm = document.getElementById("signupForm");

  // 로그인 버튼 클릭 이벤트
  btn.onclick = function (event) {
    event.preventDefault();
    modal.style.display = "block";
  };

  // 로그인 모달 닫기 버튼 클릭 이벤트
  span.onclick = function (event) {
    modal.style.display = "none";
  };

  // 로그인 폼 제출 이벤트
  loginForm.onsubmit = function (event) {
    event.preventDefault();
    // 로그인 처리 로직 구현
    console.log("Username:", document.getElementById("username").value);
    console.log("Password:", document.getElementById("password").value);

    alert("로그인되었습니다.");
    modal.style.display = "none";
  };

  // 회원가입 버튼 클릭 이벤트
  signupBtn.onclick = function (event) {
    event.preventDefault();
    signupModal.style.display = "block";
  };

  // 회원가입 모달 닫기 버튼 클릭 이벤트
  signupSpan.onclick = function (event) {
    signupModal.style.display = "none";
  };

  // 회원가입 폼 제출 이벤트
  signupForm.onsubmit = function (event) {
    event.preventDefault();
    // 회원가입 처리 로직 구현
    var newUsername = document.getElementById("newUsername").value;
    var newPassword = document.getElementById("newPassword").value;
    var name = document.getElementById("name").value;
    var birthdate = document.getElementById("birthdate").value;
    var gender = document.getElementById("gender").value;
    var email = document.getElementById("email").value;

    // 입력 값 콘솔에 출력
    console.log("New Username:", newUsername);
    console.log("New Password:", newPassword);
    console.log("Name:", name);
    console.log("Birthdate:", birthdate);
    console.log("Gender:", gender);
    console.log("Email:", email);

    alert("회원가입이 완료되었습니다.");
    signupModal.style.display = "none";
    // 폼 필드 초기화를 원한다면 여기에 추가합니다.
    signupForm.reset();
  };

  // 모달 외부 클릭 이벤트 (로그인과 회원가입 모달에 대해 동일하게 적용)
  window.onclick = function (event) {
    if (event.target == modal) {
      modal.style.display = "none";
    } else if (event.target == signupModal) {
      signupModal.style.display = "none";
    }
  };
});
