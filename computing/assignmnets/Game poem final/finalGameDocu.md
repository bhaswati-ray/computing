Life Lens, A Poetic Game of Perception

Life Lens is a short, interactive visual experience that explores how perception shapes the way we view our problems, whether as burdens or as opportunities for growth.

The aim was to create a poetic, reflective game that doesn’t focus on winning or losing, but instead mirrors the emotional process of choosing one’s perspective. Each player decision reveals how perception can change the emotional landscape of life, represented through symbolic visual and auditory elements.

Concept Origin

The initial spark for Life Lens came during a casual conversation with my roommate. We were talking about life and its endless problems, and I said something along the lines of, “Maybe it’s not about fixing the problems, but about viewing them differently.”

That one thought, the idea of viewing life through different emotional lenses, became the core of the project. I wanted to create a small, poetic experience where the act of interaction itself would become a metaphor for how we perceive life.








First Iteration, The Viewing Lens

The first version was visually direct and symbolic. I imagined a person walking through life, where every interaction would change their environment, a reflection of how perception alters reality.

However, the technical complexity of building such a character-driven system made me simplify the idea into something more distilled. The design evolved into two circular lenses, like glasses.

Each lens represented a way of seeing:

Left lens, Rain, symbolizing sadness, melancholy, and reflection.
Right lens, Flowers, symbolizing growth, joy, and resilience.

When you pressed a lens, the environment responded, either rain fell or flowers bloomed. It was a simple binary metaphor, we can’t control what happens, but we can control how we look at it.

Still, it felt a little too literal, too clear-cut between “good” and “bad.”








Second Iteration, Choice and Dual Perception

After a discussion with Swapnesh, the concept deepened. Instead of simply pressing a lens to cause a reaction, I wanted the player to choose their perception.

This version gave the player the agency to decide between both lenses, to shape the tone of their journey. The focus shifted from reaction to reflection, how our perspective leads to emotional consequences.

The visuals were refined, and the game began to include state changes and interactive feedback, small transitions that mirrored emotional shifts. This iteration established the first version of the core mechanic that still defines Life Lens, your choices define your perception.









Third Iteration, The Rocks/Problems of Life

After feedback from classmates, I realized the rain-versus-flower metaphor was too direct. Life’s problems rarely appear with such clarity. Most of the time, we don’t see our problems, we simply feel them.

So the visuals evolved again. The flowers and rain disappeared, replaced by rocks, ambiguous, textured, human. Some were tinted green, others red, not inherently good or bad, but interpreted differently depending on perception.

The player’s task became simpler but more symbolic:
“Click the rock that describes your life’s problems the most.”

Each rock triggered a short poem, either a brighter, hopeful one or a darker, introspective one. The choice wasn’t about moral judgment, it was about emotional truth.

The end screen reflected the outcome:

Green rocks (positive lens), A poem followed by “Keep this life lens.”
Red rocks (negative lens), A poem followed by “Reset your life lens.”

Pressing any key restarted the game, symbolizing that perception is cyclical, you can always reframe your life, again and again.





Technical Development

Prototyping and Visual Logic

The project began as a simple experiment with falling rectangles, placeholders for problems. I used a for loop to generate and animate them, allowing multiple rectangles, later rocks, to fall simultaneously.

Later, I introduced a class structure for each rock, defining properties like color, position, and behavior on click. Each rock existed as an object in an array, making it easy to update and manage collectively.

Game States and Flow

The interaction relied on game states, start screen, tutorial, gameplay, and poem screen. Each state was managed through global variables and if-else logic, so that every time a new state became active, the previous one was turned off.

This helped structure the emotional pacing of the game, a quiet rhythm between anticipation, reflection, and realization.

Preload and Assets

I used preload() to load all images, fonts, and sounds. The fonts helped convey emotional tone, soft for hope, stark for despair. Every sprite and poem was custom-created for this project.

Sound Implementation

Sound added the emotional texture that visuals alone couldn’t convey. Each game state had a unique audio atmosphere, subtle but deliberate.

At first, there was an issue where sounds from one game state would bleed into another, for example, the darker poem’s music continued to play during the start screen. It created a strange emotional overlap that didn’t match the visual tone.

To fix this, I used a true, false conditional system with if-else statements. When one game state became true, all others became false. Only the active game state’s sound was allowed to play. Each sound looped only while its state remained active.

This eliminated the audio overlap and made every perception self-contained, reinforcing the idea that emotional states exist in their own moments.

Of course, before reaching that calm balance, I spent an embarrassing amount of time debugging a sound issue that turned out to be because I forgot to write “.mp3” in the filename. 



Final Reflection

Life Lens is not a game about winning, but about feeling. It is a 30-second poem disguised as an interaction , an introspective loop where you decide how to see your life.

Every click is a micro-choice, every state change a shift in awareness. The falling rocks, looping code, and carefully isolated sounds all come together to mirror one simple truth:

You cannot control what falls into your life,
but you can always choose how to see it. 