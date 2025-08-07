const SERVER_URL = "http://localhost:3000/";

(async () => {
  const container = document.querySelector(".symptom-checker-widget");
  const loader = document.getElementById("loader-overlay");
  const key = container.getAttribute("data-key");

  if (!container || !loader) {
    return console.error("Wrong code snippet: container or loader not found.");
  }
  // Remove previous content if any
  container.innerHTML = "";

  // Create the image element
  const img = document.createElement("img");
  img.id = "kid-map";
  img.alt = "KID Map";
  img.src = SERVER_URL + "static/images/Symptom-Checker-Kids-320px.png";
  img.useMap = "#kid-map";
  container.appendChild(img);

  // Create the map element
  const map = document.createElement("map");
  map.name = "kid-map";
  map.innerHTML = `
    <!-- 🧒 Boy DATA -->
    <area shape="poly" coords="100, 48, 94, 43, 89, 48, 90, 53, 95, 58, 94, 61, 89, 59, 87, 55, 84, 50, 81, 48, 80, 42, 79, 39, 79, 33, 79, 29, 80, 25, 82, 22, 85, 20, 89, 18, 94, 16, 96, 15, 103, 14, 107, 14, 113, 14, 117, 14, 121, 16, 124, 18, 128, 19, 133, 23, 135, 26, 137, 30, 136, 32, 133, 32, 126, 32, 118, 34, 114, 33, 112, 33, 106, 33, 106, 38, 106, 42, 105, 44" href="#" alt="Boy Head" data-key="head">
    <area shape="poly" coords="106, 39, 119, 39, 127, 39, 133, 43, 134, 56, 132, 59, 124, 59, 116, 53, 111, 51, 101, 48, 104, 43" href="#" alt="Boy Eyes" data-key="eyes">
    <area shape="poly" coords="101, 47, 94, 59, 104, 67, 114, 73, 121, 73, 128, 68, 130, 62, 119, 60, 110, 55" href="#" alt="Boy Mouth" data-key="mouth">
    <area shape="poly" coords="100, 48, 96, 43, 90, 46, 89, 53, 93, 57, 97, 55" href="#" alt="Boy Ears" data-key="ears">
    <area shape="poly" coords="96, 59, 110, 72, 109, 76, 104, 79, 97, 76, 93, 69, 92, 63" href="#" alt="Boy Neck Or Back" data-key="neck">
    <area shape="poly" coords="91, 65, 82, 64, 72, 66, 64, 72, 53, 79, 47, 86, 43, 96, 40, 102, 33, 107, 32, 113, 35, 117, 39, 118, 41, 115, 42, 118, 44, 120, 46, 115, 47, 119, 51, 113, 51, 109, 50, 104, 52, 99, 59, 92, 63, 90, 67, 91, 73, 90, 78, 84, 81, 74, 88, 68, 98, 65, 104, 69, 114, 76, 120, 84, 123, 89, 128, 92, 134, 91, 144, 87, 148, 82, 152, 73, 155, 74, 154, 80, 159, 77, 164, 73, 166, 77, 162, 81, 165, 81, 167, 82, 169, 80, 168, 86, 167, 86, 165, 87, 170, 88, 167, 90, 164, 90, 159, 91, 155, 93, 151, 97, 146, 101, 140, 104, 134, 107, 130, 108, 124, 112, 118, 108, 111, 100, 113, 90, 115, 77, 103, 69, 98, 64" href="#" alt="Boy Arms" data-key="arms">
    <area shape="poly" coords="91, 65, 80, 76, 74, 88, 70, 101, 87, 107, 101, 109, 107, 109, 115, 86, 112, 75, 104, 79, 98, 78, 93, 72" href="#" alt="Boy Chest" data-key="chest">
    <area shape="poly" coords="67, 106, 75, 110, 83, 112, 93, 114, 100, 114, 106, 114, 104, 126, 95, 126, 84, 126, 73, 124, 67, 121, 64, 120, 64, 111" href="#" alt="Abdomen" data-key="abdomen">
    <area shape="poly" coords="216, 129, 211, 136, 225, 142, 237, 143, 256, 136, 255, 127, 251, 122, 244, 127, 237, 128, 227, 130" href="#" alt="Genital Area or Urinary" data-key="genetical">
    <area shape="poly" coords="58, 135, 86, 139, 98, 138, 111, 134, 117, 139, 115, 141, 120, 147, 122, 152, 124, 162, 126, 170, 128, 176, 130, 181, 133, 183, 140, 182, 146, 182, 152, 185, 149, 190, 144, 195, 138, 197, 132, 201, 124, 202, 121, 203, 118, 196, 119, 190, 118, 184, 113, 176, 109, 170, 108, 165, 107, 159, 102, 154, 99, 156, 96, 152, 90, 148, 88, 144, 83, 148, 82, 152, 79, 156, 74, 156, 74, 158, 71, 161, 66, 165, 58, 165, 47, 164, 39, 163, 34, 168, 31, 174, 27, 175, 22, 172, 21, 166, 21, 161, 24, 153, 32, 144, 40, 145, 42, 148, 46, 148, 54, 150, 55, 148, 54, 145, 55, 141" href="#" alt="Boy Legs" data-key="legs">
    <!-- 👧 Girl DATA -->
    <area shape="poly" coords="188, 43, 191, 39, 196, 37, 200, 36, 202, 40, 205, 45, 208, 49, 210, 50, 215, 54, 218, 55, 221, 51, 224, 50, 226, 52, 228, 53, 229, 54, 230, 57, 230, 61, 229, 61, 227, 63, 226, 64, 224, 65, 227, 67, 229, 68, 232, 64, 235, 62, 237, 59, 238, 55, 238, 51, 239, 47, 240, 44, 241, 41, 245, 46, 245, 47, 246, 49, 247, 50, 248, 51, 249, 51, 252, 53, 259, 53, 264, 53, 268, 50, 269, 48, 263, 47, 260, 47, 261, 45, 269, 45, 270, 44, 272, 41, 275, 34, 274, 30, 272, 33, 271, 34, 268, 34, 264, 34, 261, 33, 258, 31, 251, 27, 248, 27, 245, 28, 240, 32, 239, 33, 237, 35, 235, 33, 230, 28, 229, 26, 224, 24, 221, 24, 215, 23, 211, 23, 200, 24, 196, 28, 194, 31, 192, 34" href="#" alt="Girl Head" data-key="head">
    <area shape="poly" coords="188, 46, 195, 43, 203, 42, 208, 48, 215, 53, 204, 62, 190, 68, 187, 64, 189, 62, 190, 54" href="#" alt="Eyes" data-key="eyes">
    <area shape="poly" coords="218, 56, 220, 51, 224, 49, 228, 52, 230, 57, 228, 61, 225, 65" href="#" alt="Ears" data-key="ears">
    <area shape="poly" coords="190, 68, 202, 65, 208, 58, 212, 51, 224, 66, 216, 73, 208, 77, 202, 81, 195, 78" href="#" alt="Mouth" data-key="mouth">
    <area shape="poly" coords="224, 64, 211, 79, 212, 84, 220, 86, 226, 80, 229, 74, 228, 68" href="#" alt="Neck" data-key="neck">
    <area shape="poly" coords="212, 80, 206, 91, 208, 102, 213, 114, 215, 121, 228, 118, 248, 111, 244, 101, 244, 94, 235, 74, 229, 72, 227, 82, 224, 86, 217, 86" href="#" alt="Chest" data-key="chest">
    <area shape="poly" coords="214, 117, 225, 117, 239, 115, 248, 111, 253, 121, 248, 125, 241, 127, 231, 130, 216, 130" href="#" alt="Abdomen" data-key="abdomen">
    <area shape="poly" coords="63, 118, 59, 131, 77, 137, 91, 139, 105, 138, 110, 133, 104, 125, 91, 126, 80, 126" href="#" alt="" data-key="genetical">
    <area shape="poly" coords="209, 138, 224, 144, 237, 145, 251, 142, 257, 141, 262, 146, 258, 150, 262, 154, 269, 151, 272, 146, 280, 143, 286, 148, 291, 154, 293, 159, 294, 163, 294, 170, 291, 173, 287, 172, 282, 167, 280, 165, 275, 161, 270, 164, 261, 170, 259, 171, 252, 171, 243, 164, 240, 158, 236, 158, 235, 153, 233, 150, 229, 153, 225, 158, 221, 158, 216, 163, 213, 168, 211, 174, 211, 179, 209, 185, 206, 190, 204, 194, 203, 199, 202, 205, 200, 209, 192, 209, 184, 206, 178, 203, 174, 201, 172, 196, 172, 192, 176, 191, 179, 191, 182, 191, 185, 192, 187, 192, 191, 189, 194, 184, 196, 175, 197, 171, 198, 164, 198, 160, 202, 151, 204, 149, 205, 145, 207, 141" href="#" alt="Legs" data-key="legs">
    <area shape="poly" coords="216, 73, 201, 90, 192, 100, 195, 102, 191, 104, 184, 104, 178, 105, 171, 105, 161, 100, 161, 104, 163, 106, 158, 106, 153, 106, 153, 108, 156, 109, 152, 111, 150, 113, 154, 113, 156, 113, 152, 116, 155, 117, 156, 117, 157, 117, 156, 120, 158, 121, 160, 121, 164, 119, 168, 119, 174, 117, 180, 117, 184, 117, 188, 117, 192, 117, 199, 117, 200, 117, 205, 111, 207, 108, 208, 100, 216, 77, 229, 72, 245, 76, 257, 80, 264, 85, 273, 92, 279, 95, 282, 97, 293, 98, 299, 98, 295, 103, 294, 105, 299, 107, 296, 109, 294, 107, 297, 111, 298, 114, 292, 112, 290, 110, 292, 114, 283, 110, 284, 112, 284, 116, 279, 112, 275, 107, 272, 103, 268, 100, 261, 96, 254, 96, 253, 99, 249, 95, 243, 94, 239, 92, 235, 86, 235, 81, 231, 74" href="#" alt="Arms" data-key="arms">
  `;
  container.appendChild(map);
  // Drawer Sidebar
  container.insertAdjacentHTML(
    "beforeend",
    `
    <!-- Drawer Sidebar -->
    <div id="drawerOverlay" style="display:none;"></div>
    <div id="drawer" class="drawer">
        <button id="drawerClose">&times;</button>
        <div id="drawerContent">
            <!-- Content will be injected here -->
        </div>
    </div>
    `
  );

  function loadScript(src, callback) {
    const script = document.createElement("script");
    script.src = src;
    script.onload = callback;
    script.onerror = function () {
      console.error("Failed to load script:", src);
    };
    document.head.appendChild(script);
  }

  // First load jQuery, then ImageMapster
  loadScript("https://code.jquery.com/jquery-3.6.0.min.js", function () {
    loadScript(
      "https://unpkg.com/imagemapster/dist/jquery.imagemapster.min.js",
      function () {
        $(async function () {
          // Assume `data` is available globally or fetched elsewhere
          // If not, you may need to fetch or define it before using
          const userAgent =
            navigator.userAgent || navigator.vendor || window.opera;
          const isMobileDevice =
            /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
              userAgent
            );
          const device = isMobileDevice ? "mobile" : "desktop";

          const isMobile = device === "mobile";
          const $image = $("#kid-map");

          const commonOptions = {
            fillColor: "ff0000",
            fillOpacity: 0.5,
            stroke: true,
            strokeColor: "000000",
            strokeWidth: 0.1,
            mapKey: "data-key",
            singleSelect: true,
            showToolTip: true,
            fadeInterval: 50,
            toolTipContainer:
              '<div style="background:#fff;padding:5px;border:1px solid #ccc;"></div>',
            toolTipClose: ["tooltip-click", "area-click", "image-mouseout"],
          };

          const mobileOptions = {
            ...commonOptions,
            enableAutoResizeSupport: true,
            scaleMap: true,
            render_highlight: {
              fillColor: "2aff00",
              stroke: true,
              strokeWidth: 0.1,
            },
            render_select: {
              fillColor: "ff000c",
              stroke: false,
            },
          };

          const desktopOptions = {
            ...commonOptions,
            enableAutoResizeSupport: true,
            autoResize: true,
            configTimeout: 30000,
            render_highlight: {
              fillColor: "ff0000",
              stroke: true,
              altImage:
                "https://irp.cdn-website.com/007fab07/dms3rep/multi/Symptom-Checker-Kids-Hover-1300px-Red.png",
            },
            render_select: {
              fillColor: "ff0000",
              stroke: false,
              altImage:
                "https://irp.cdn-website.com/007fab07/dms3rep/multi/Symptom-Checker-Kids-Hover-1300px-Red.png",
            },
          };

          $image
            .on("load", function () {
              if ($image.data("mapster")) {
                $image.mapster("unbind");
              }
              $image.mapster({
                ...(isMobile ? mobileOptions : desktopOptions),
                onConfigured: function () {
                  console.log("✅ Mapster binding complete!");
                },
              });
            })
            .each(function () {
              if (this.complete) $(this).trigger("load");
            });

          if ($image[0].complete) {
            $image.trigger("load");
          }

          let detailUrl = `${SERVER_URL}api/symptom-checker?key=${key}`;
          const res = await fetch(detailUrl);
          const allArticles = await res.json();

          // let allArticles = data?.config?.Articles;
          const groupedBySubClass = {};

          if (allArticles && allArticles.length > 0) {
            allArticles.forEach((article) => {
              let sub = article.fields.SubClass;
              if (!groupedBySubClass[sub]) {
                groupedBySubClass[sub] = [];
              }
              groupedBySubClass[sub].push({
                ArticleTitle: article.fields["Article HTML"],
                ArticleURL: `${SERVER_URL}/${article.fields["Article URL"]}`,
              });
            });
          }

          const bodyPartDetails = {
            head: {
              name: "Head",
              description:
                "Common symptoms: headache, dizziness, scalp issues.",
              articles: groupedBySubClass?.["head-or-brain"],
            },
            eyes: {
              name: "Eyes",
              description: "Common symptoms: redness, itching, vision changes.",
              articles: groupedBySubClass?.["eye"],
            },
            mouth: {
              name: "Mouth",
              description:
                "Common symptoms: mouth sores, tooth pain, dry mouth.",
              articles: groupedBySubClass?.["mouth-or-teeth"],
            },
            ears: {
              name: "Ears",
              description: "Common symptoms: earache, hearing loss, discharge.",
              articles: groupedBySubClass?.["ear"],
            },
            neck: {
              name: "Neck or Back",
              description: "Common symptoms: stiffness, pain, swelling.",
              articles: groupedBySubClass?.["neck-or-back"],
            },
            arms: {
              name: "Arms",
              description: "Common symptoms: rashes, pain, swelling.",
              articles: groupedBySubClass?.["arm-or-hand"],
            },
            chest: {
              name: "Chest",
              description:
                "Common symptoms: chest pain, cough, breathing issues.",
              articles: groupedBySubClass?.["chest"],
            },
            abdomen: {
              name: "Abdomen",
              description: "Common symptoms: stomach ache, nausea, bloating.",
              articles: groupedBySubClass?.["abdomen"],
            },
            genetical: {
              name: "Genital Area or Urinary",
              description: "Common symptoms: pain, itching, urinary issues.",
              articles: groupedBySubClass?.["genitals-or-urinary"],
            },
            legs: {
              name: "Legs",
              description: "Common symptoms: pain, swelling, limping.",
              articles: groupedBySubClass?.["leg-or-foot"],
            },
          };

          function openDrawer(key) {
            const part = bodyPartDetails[key];
            if (!part) return;
            $("#drawerTitle").text(part.name);
            let icon = "🩺";
            switch (key) {
              case "head":
                icon = "🧑‍🦱";
                break;
              case "eyes":
                icon = "👁️";
                break;
              case "mouth":
                icon = "👄";
                break;
              case "ears":
                icon = "👂";
                break;
              case "neck":
                icon = "🦴";
                break;
              case "arms":
                icon = "💪";
                break;
              case "chest":
                icon = "🫁";
                break;
              case "abdomen":
                icon = "🍽️";
                break;
              case "genetical":
                icon = "🚻";
                break;
              case "legs":
                icon = "🦵";
                break;
            }
            $("#drawerIcon").text(icon);

            let html = "";
            html += `<h3>${part.name}</h3>`;
            html += `<p>${part.description}</p>`;
            if (part.articles && part.articles.length) {
              html += `<h4>Related Articles</h4><ul>`;
              part.articles.forEach((a) => {
                html += `<li><a href="${a.ArticleURL}" target="_blank">${a.ArticleTitle}</a></li>`;
              });
              html += `</ul>`;
            }
            $("#drawerContent").html(html);
            $("#drawerOverlay").show();
            $("#drawer").addClass("open");
          }

          function closeDrawer() {
            $("#drawer").removeClass("open");
            $("#drawerOverlay").hide();
            $("img").mapster("set", false, "head");
            $("img").mapster("set", false, "eyes");
            $("img").mapster("set", false, "mouth");
            $("img").mapster("set", false, "ears");
            $("img").mapster("set", false, "neck");
            $("img").mapster("set", false, "arms");
            $("img").mapster("set", false, "chest");
            $("img").mapster("set", false, "abdomen");
            $("img").mapster("set", false, "genetical");
            $("img").mapster("set", false, "legs");
          }

          $("#drawerClose, #drawerOverlay").on("click", closeDrawer);

          $('map[name="kid-map"] area').on("click", function (e) {
            e.preventDefault();
            const key = $(this).data("key");
            openDrawer(key);
          });
        });
      }
    );
  });
})();
