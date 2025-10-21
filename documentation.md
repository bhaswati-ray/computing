P5.js Documentation

Overview

I really had no prior experience in coding or programming, and I came from an art background. My understanding of logic and math is minimal, but I was curious about how it could contribute to visual design. At the same time, I had contradictory feelings about it, because math doesn’t like me—or maybe logic doesn’t like me. Still, I wanted to see how something that feels so structured and rule-based could create something visual and expressive.

Day 1 — Basic Shapes and the Rasa of Courage

In the first class, we learned about the setup() and draw() functions and how they create the base structure of a p5.js sketch. We experimented with simple shapes like circles, rectangles, and triangles, and learned how to apply color using the fill() function.

For our first assignment, we had to translate an emotion or rasa into an abstract composition using only geometric forms. I got the rasa of Courage, I wanted to do corrage of unqiueness, which for me, felt like sparks.

At first, I tried using triangles because I felt their sharpness could represent the boldness and intensity of courage. But soon I realized that plotting the coordinates of triangles was much harder than I expected. No matter how I adjusted them, the sparks didn’t look the way I imagined. So I tried again.

In my second iteration, I replaced the triangles with circles and rectangles. The circles represented the origin point, the moment of thought, of daring , and the rectangles stretched outward like streaks of energy. Together, they formed a sense of direction and movement, like courage spreading outwards from a single point.

The background was gray to represent mundanity. the ordinary world where courage stands out like a spark in dullness.

That was my first encounter with how coding could reflect emotion, not through direct representation, but through rhythm, form, and logic.

Day 2 — Variables, Interactivity, and Transition from Courage to Fear

On the second day, we learned about variables and interactivity, how to use mouseX and mouseY, and how changing values can make the visuals respond to actions like mouse movement or clicks. We also worked with conditionals like if and else, and I began to see how code could build small systems of cause and effect.

The assignment was to translate the previous emotion into its opposite. So I worked on transforming Courage into Fear. On a mouse click, all the bright sparks that represented courage disappeared, and sharp triangles appeared in their place. The circular glow dimmed into a low, faint orange , almost lifeless. The scene became quiet and tense, like the spark had been extinguished.

This project helped me understand how interactivity could be used to express emotional change. The challenge wasn’t just technical but conceptual — how to make a digital sketch feel something. Even though I’m still struggling with triangle coordinates (they have a personal vendetta against me).

Day 3 — Pattern Grid Exploration

On Day 3, we were introduced to preload() and loops, The assignment was to create a 50-pixel-based grid and draw anything we liked that could form a continuous pattern.

My first attempt was... chaotic, to say the least. The pattern refused to loop seamlessly and broke the moment it hit the edges of the grid. 
Initially, I tried making a cat and a fish, which looked adorable but didn’t quite connect. So, in my second attempt, I went abstract, cloud-like shapes that shifted between being cats, bats, or even stingrays depending on how you looked at them. It reminded me of how creativity often lives in ambiguity , not one form, but many interpretations at once.

I started watching The Coding Train videos to understand more.

Day 4 — The Spitesheets

Day 4 was the spreadsheet was fun but the kind of assignment that humbled me. The goal was to load a spreadsheet and assign keys to specific actions in p5.js. It sounded easy until i started to wrte the same code on my own . My  few tries were full of syntax errors and commas misplaced.


There’s a strange satisfaction in making logic move. I realized that coding feels less like strict math and more like choreography , it became intimidating it became.

  GAME POEM - Weekend Assignment: “Life LENS”
Weekend Assignment: “Life LENS”

For the weekend assignment, I wanted to make something emotional. something like one small change can shift everything.

At first, I had no inspiration. my roomate inspired me. But during a late-night chat with my roommate, I told her, “Maybe you’re seeing it differently—you could see it in a positive light.” It inspired me. I wanted to make a piece that captures the difference between “I have to do this” and “I get to do this.”

The concept: a pair of spectacles—one lens shows dull, negative visuals, while the other shows soft, blooming positivity. When you click one lens, the world drains of color — when you click the other, flowers start to fall. Initially, I made small yellow blobs for the flowers, but I wasn’t happy with how lifeless they looked. I wanted the scene to feel warm, like gentle affirmations falling from the sky.

I used class and constructor to create objects like petals and raindrops, a concept that only clicked for me during class. It was eye-opening to realize how you could build a “bag” of objects define them once, and then let them multiply, interact, and exist together. I also referenced The Coding Train and chat gpt after mutiple attenps tiring efforts of making 7/8 flowers by push n pop.

The Poems: Giving a Voice to Perception

As the game developed from a simple visual toy into a choice-based experience with falling rocks, I felt it needed a conclusion. The shifting background colors were subtle, but I wanted a final, reflective moment that explicitly stated the outcome of the player's choices. This is where the poems came in.

The two poems—one for the "dark" path and one for the "light"—serve as the voice of the player's final perception. They aren't just an ending; they're a mirror. The dark poem uses a deep red background with stark, matching text to create a feeling of being enveloped by a harsh truth. In contrast, the light poem sits on a calm, deep blue background, aiming for a sense of quiet hope rather than overt happiness. The goal was to make the final screen feel like a personal reflection, the natural end-point of the small choices made during the game.

From Concept to Gameplay: The Evolution

The journey from the initial idea to the final game involved many changes that added layers to the experience. The placeholder rectangles were replaced with rock sprites, which felt more metaphorical—our problems can feel heavy, like stones. This change inspired me to build a more structured narrative.

To do this, I implemented a gameState system. This was a breakthrough, allowing me to create distinct "scenes": a start screen, a tutorial, the core gameplay, and the final poem screens. The tutorial stage itself evolved significantly. Initially, it was just text. Then, I added an animated hand to show the player what to do. Finally, it became a more thematic introduction, presenting both the red and blue rocks and asking the player a direct question about their own problems. This front-loads the game's central theme of choice.

I wanted the game world to react to these choices. Using lerpColor(), I programmed the background to shift seamlessly from a neutral beige towards a deep, brooding red or a calm sky blue, depending on the player's clicks. This visual feedback makes every interaction feel more meaningful. The game's conclusion also changed; I moved from a timed session to a fixed number of 11 rock interactions. This shifted the focus from speed to the weight of each choice. Finally, UI refinements like the grey top bar and the use of the "Horizon" font for titles helped create a more polished and cohesive aesthetic.

Problems Faced and Solutions Found

The development process involved several technical challenges that required systematic debugging and research to resolve. The most significant issues were related to the implementation of the audio system and the asset loading pipeline.

Audio Autoplay Restriction: A primary technical hurdle was the failure of background music to play upon the initial loading of the start screen. Research indicated that modern browser policies restrict the automatic playback of audio until a user-initiated event occurs.

Solution: To address this, a flag-based system was implemented. A boolean variable, musicStarted, was initialized to false. A single-use userInteracted() function was created to be called by both the mousePressed() and keyPressed() event listeners. On the first invocation, this function resumes the browser's AudioContext and sets the musicStarted flag to true, effectively unlocking audio playback for the remainder of the session.

State-Dependent Audio Management: An early implementation resulted in audio tracks from previous game states persisting into subsequent states (e.g., gameplay music continuing over the final poem screen). This created an incoherent auditory experience.

Solution: A centralized function, manageMusic(startFlag, gameFlag), was developed to act as a state machine for audio. Each primary draw function (drawStartScreen, drawGamePlay, etc.) calls this manager on every frame, passing boolean flags to indicate which track should be active. The manageMusic function then compares these desired states to the current playback states (startMusicPlaying, gameMusicPlaying), initiating volume fades using setVolume(level, fadeTime) to smoothly transition between tracks. This declarative approach ensures that only the correct audio is playing for any given game state.

Asset Pipeline Failure (404 Error): During development, all external assets, including fonts and sounds, failed to load, with the browser's developer console reporting a "404 (Not Found)" error for each resource. This occurred despite visual confirmation that the asset folder was located within the project directory.

Solution: The root cause was identified as an issue with URI encoding of the file path. The asset folder was named art n sound, containing spaces. While some local servers can resolve this, it is not a web-safe practice. The problem was resolved by renaming the folder to art_n_sound and updating the assetPath variable in the preload() function accordingly. This ensured that the resource paths were unambiguous and universally valid, correcting the loading error.

Even though the project isn’t fully complete, I want to expand it, add weather changes, different emotional responses, and subtle affirmations that feel genuine rather than overly positive. The goal is to create something introspective—a little melancholy, a little magic—that reminds the player that perception is everything. It’s a small experiment in showing how the lens we choose, even in a simple game of falling rocks, can color our entire world, leading us down a path of shadow or towards a silver lining.