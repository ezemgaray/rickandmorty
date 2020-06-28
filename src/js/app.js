$(function () {
   /**
    * switchClass(fromClass, ToClass)
    * jquery custom function to replace classes
    */
   (function ($) {
      $.fn.switchClass = function (fromClass, toClass) {
         return this.removeClass(fromClass).addClass(toClass);
      };
   }(jQuery));

   // Start App
   getInfo("https://rickandmortyapi.com/api/episode", "menu", "Episode")

   //Change Filter menu
   $("#filter").change(function () {
      getInfo("https://rickandmortyapi.com/api/" + $("#filter").val().toLowerCase(), "menu", $("#filter").val())
      $("#menu-title").text($("#filter").val() + "s")
      allEpisodes = false
   })
   //Change arrow menu button (mobile)
   $('#checkmenu').change(function () {
      if ($('#checkmenu').is(":checked")) $('[for="checkmenu"] span').text("❮")
      else $('[for="checkmenu"] span').text("❯")
   })

   /**
    * Get data from HATEOAS API
    * @param {*String} url -> URL of the request
    * @param {*String} destination -> Destination where the data will be processed
    * @param {*String} type  -> Menu Filter
    * * destination = "menu", "episodes", "episode", "characters", "character", "location" or "residents"
    * * type: "Episode", "Location" or "Character" (capital letter)
    */
   function getInfo(url, destination, type) {
      axios({
            method: 'get',
            url: url
         })
         .then(function (response) {
            // handle success
            let data = response.data
            // Derive the response
            switch (destination) {
               case "menu":
                  create.menu(data, type)
                  break
               case "episodes":
                  show.episodeCard(data)
                  break
               case "episode":
                  show.episodeDescription(data)
                  break
               case "characters":
                  show.characterCard(data, "related-characters")
                  break
               case "character":
                  show.characterDescription(data)
                  break
               case "location":
                  show.locationDescription(data)
                  break
               case "residents":
                  show.characterCard(data, "origin-characters")
                  break
            }
         })
         .catch(function (error) {
            console.log(error.response.data.error)
         })
   }

   let allEpisodes = false // Status if the second page of episodes is shown, allEpisodes = true
   const create = {
      /**
       * Show menu items and request  characters when items are clicked
       * @param {*Objext} data -> response data (episodes, characters or locations)
       * @param {*String} type -> Filter (data from select tag HTML)
       */
      menu: function (data, type) {
         if (!allEpisodes || type != "Episode") {
            $("#menu-list").empty()
         }
         $(data.results).each(function (index, item) {
            //add item
            $("#menu-list").append($(`<span ${type.toLowerCase()}="${item.id}">${(type =="Episode") ? type + " " + item.id : (type == "Character") ? item.name : item.name}</span>`)
               // Add click listener
               .click(function () {
                  //Show section
                  goTo.clickCard(type.toLowerCase(), item.id)
               }))
         })
         //Show first item of the list
         $("#menu-list span:nth-child(1)").click()

         // Show button or pagination according type
         switch (type) {
            case "Episode":
               create.loadMore(data.info.next)
               break
            case "Character":
            case "Location":
               this.pagination(data.info.prev, data.info.next, type)
               break
         }
      },
      /**
       * Generates the url to request in a single query all the items to show on the cards
       * @param {*Array} collection -> List of urls of the items to show
       * @param {*String} type -> Type of items to show ("characters, residents, episodes")
       */
      filter: function (collection, type) {
         let filter = []
         $(collection).each(function (index, character) {
            filter.push(character.split("/").pop())
         })
         if (type === "characters" || type === "residents") {
            if (filter.length == 0) {
               show.characterCard(filter, "origin-characters")
               return
            }
            getInfo("https://rickandmortyapi.com/api/character/" + filter.join(","), type)
         } else {
            getInfo("https://rickandmortyapi.com/api/episode/" + filter.join(","), type)
         }
      },
      /**
       * Show second page of episodes.
       * @param {*String} next -> URL of the next page.
       */
      loadMore: function (next) {
         $("#load-more").show().off()
         $("#pagination").hide()

         if (!allEpisodes) {
            $("#load-more").text("Load more").click(function () {
               allEpisodes = true
               getInfo(next, "menu", "Episode")
            })
         } else {
            $("#load-more").text("Reduce list").click(function () {
               allEpisodes = false
               getInfo("https://rickandmortyapi.com/api/episode", "menu", "Episode")
            })
         }
      },
      /**
       * Generate pagination. Set links (prev and next)
       * and set the page number according to the prev link.
       * If there is no previous or next page, the value is null
       * @param {*String} prev  -> URL
       * @param {*String} next  -> URL
       * @param {*String} type  -> Menu filter ("Episode", "Character", "Location")
       */
      pagination(prev, next, type) {
         $("#pagination").show()
         $("#load-more").hide()
         //Remove previous event
         $("#menu-next").off()
         $("#menu-prev").off()

         // Add click listener just for once
         $("#menu-next").one("click", function () {
            getInfo(next, "menu", type)
         })
         $("#menu-prev").one("click", function () {
            getInfo(prev, "menu", type)
         })
         // Set page number
         if (!prev) $("#menu-current").text("1")
         else $("#menu-current").text(parseInt(prev.split("=").pop()) + 1)
         //Hide null link
         if (!prev) $("#menu-prev").hide()
         else $("#menu-prev").show()
         if (!next) $("#menu-next").hide()
         else $("#menu-next").show()
      }
   }

   const show = {
      /**
       * Show episode data and generate cards of characters that appear
       * (When an episode is selected)
       * @param {*Object} episode -> response data of episode
       */
      episodeDescription: function (episode) {
         // Show episode data
         $('#selected-episode').html(`
         <h2 class="bolder">Episode ${episode.id}: "${episode.name}"</h2>
         <div class="info__container">
            <p><b>Air Date:</b> ${episode.air_date}</p>
            <p><b>Episode:</b> ${episode.episode}</p>
         </div>
         `)
         $("#related-characters").empty()
         //Generate character cards
         create.filter(episode.characters, "characters")
         //Show episode Section
         goTo.episodes()
      },
      /**
       * Show episode cards (When a character is shown)
       * @param {*Object} episode  -> Episode data
       */
      episodeCard: function (episodes) {
         $("#related-episodes").empty()
         $(episodes).each(function (index, episode) {
            $("#related-episodes").append($(`<div class="card">`).click(function () {
                  // goTo.clickMenu("episode", episode.id)
                  goTo.clickCard("episode", episode.id)
               })
               .append($(`
            <div class="card__body">
               <div class="info__container">
                  <h3 class="bolder">${episode.name}</h3>
                  <p><small>Episode ${episode.id}</small></p>
                  <p><small>${episode.episode}</small></p>
               </div>
            </div>`))
            )
         })

      },
      /**
       * Show Character data (When character card is clicked)
       * @param {*Object} character -> Character data
       */
      characterDescription(character) {
         //Set image
         $("#character-img").css("background-image", `url(${character.image})`)
         $("#character-info").empty()
            //Add character data
            .append($(`
         <div class="info__container">
         <h2 class="bolder">${character.name}</h2>
         <p><span class="${character.status}">${character.status}</span></p>
         </div>`)
               .append($(`
         <div class="info__container">
         <small>Specie:</small>
         <p> ${character.species} - ${character.type || "Unknown"}</p>
         </div>`))
               .append($(`
         <div class="info__container">
         <small>Gender:</small>
         <p>${character.gender}</p>
         </div>`))
               .append($(`
         <div class="info__container btn">
         <small>Origin Name:</small>
         <p>${character.origin.name}</p>
         </div>`))
               //Add click listener to go to the location (origin name)
               .click(function () {
                  // getInfo(character.origin.url, "location")
                  goTo.clickCard("location", character.origin.url.split("/").pop())
                  //Show locationsection
               })
            ) //end main "append"
         //Show Character section
         create.filter(character.episode, "episodes")
         goTo.character()
      },
      /**
       * Show character card (When an episode or location is shown)
       * @param {*Array} characters -> Characters data
       * @param {*String} section -> Destination where the card will be printed
       */
      characterCard: function (characters, section) {
         if (characters.length === 0) {
            // Message when a location has no residents
            $("#" + section).append($(`<h2 class="related-title">No one lives here...</h2>`).css("color", "#76F96E"))
            return
         }
         $(characters).each(function (index, character) {
            //Add card according section
            $("#" + section).append($(`<div class="card">`)
               // Add click listener to go to the character section.
               .click(function () {
                  // Show character section with description and related episodes
                  create.filter(character.episode, "episodes")
                  goTo.clickCard("character", character.id)
               })
               .append($(`<div class="card__header"></div>`).css("background-image", `url(${character.image})`))
               .append($(`
               <div class="card__body">
                     <div class="info__container">
                        <h3 class="bolder">${character.name}</h3>
                        <p><span class="${character.status}">${character.status}</span> - ${character.species}</p>
                        <p><small>Gender: ${character.gender}</small></p>
                     </div>
                  </div>
               </div>`))
            )
         })
      },
      /**
       * Show location description (when origin name in character section is clicked)
       * @param {*Object} location -> Location data
       */
      locationDescription: function (location) {
         $('#selected-location').html(`
         <h2 class="bolder">"${location.name}"</h2>
         <div class="info__container">
            <p><b>Type:</b> ${location.type}</p>
            <p><b>Dimension:</b> ${location.dimension}</p>
         </div>
         `)
         $("#origin-characters").empty()
         // Create characters ("residents")
         create.filter(location.residents, "residents")
         goTo.locations()
      },
   }

   const goTo = {
      character: function () {
         $("#characters").switchClass("hide", "show")
         $("#episodes").switchClass("show", "hide")
         $("#locations").switchClass("show", "hide")
      },
      episodes: function () {
         $("#episodes").switchClass("hide", "show")
         $("#characters").switchClass("show", "hide")
         $("#locations").switchClass("show", "hide")
      },
      locations: function () {
         $("#locations").switchClass("hide", "show")
         $("#episodes").switchClass("show", "hide")
         $("#characters").switchClass("show", "hide")
      },
      /**
       * Reques data to show of card clicked
       * @param {*String} type -> type of item required (episode, character, location)
       * @param {*Number} id -> item id
       */
      clickCard: function (type, id) {
         getInfo("https://rickandmortyapi.com/api/" + type + "/" + id, type)
      }
   }
})