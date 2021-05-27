Edge Not Found is a Sokoban-style puzzle game set on an infinitely repeating grid. There are 20+ puzzles and they can get pretty tricky. Tested in Firefox and Chrome. My submission for js13k 2020. You can play it on [js13kgames](https://js13kgames.com/games/edge-not-found/index.html) or [itch.io](https://auroriax.itch.io/edge-not-found). To build the game, start a web server in the root folder of this project and open index.html, or use [Web2Exe](https://github.com/jyapayne/Web2Executable) to make desktop builds.

It uses [rough](https://github.com/rough-stuff/rough) by Preet Shihn for rendering ([under the MIT License](https://github.com/rough-stuff/rough/blob/master/LICENSE)) and [ZzFX](https://github.com/KilledByAPixel/ZzFX) by Frank Force for audio effects ([also under the MIT License](https://github.com/rough-stuff/rough/blob/master/LICENSE)). The rest of the project is under the [Charity License](https://github.com/Auroriax/js13k-2020/blob/master/LICENSE), which is fairly permissive but prohibits commercial exploitation.

![Title screen of Edge Not Found.](https://auroriax.com/wp-content/uploads/2020/09/enf_title-e1600798525227.png)

# Postmortem

So I participated in js13k again this year, this time sticking to my cards better and decided to make an [eye- as much as a brain-bending puzzle game called Edge Not Found](https://auroriax.itch.io/edge-not-found). After working for almost a year in TypeScript (and Canvas) for my job, I feel I have a lot more experience working with the browser, along with the things I've learned from my entry last year. So here's another larger-than-13kb postmortem about a smaller-than-13kb game.

[js13k](http://js13kgames.com/) last year was the most fun I've had with a game jam. There's [a lot of activity from devs on Twitter](https://twitter.com/hashtag/js13k?f=live) (though not overwhelmingly so), the month-long deadline is very relaxed compared to some other game jams (you'll finish on time even if you contribute just half a kilobyte per day!), and there are simply [some amazing technical marvels](https://twitter.com/MaximeEuziere/status/1306553299416608769) that people create even despite all these limitations.

Last year I wanted to try out the [Zdog](https://zzz.dog/) library, this time my choice fell on [rough.js](https://roughjs.com/), which creates seemingly hand-drawn versions of geometrical shapes like cubes and circles. I stumbled upon [a blog post that explained how this effect was achieved](https://shihn.ca/posts/2020/roughjs-algorithms/), which made me want to try it out. Next to that, I've been working on a mini JS framework called Tomato that supported timing, hitbox and input management, which [I wanted (and did) improve during the jam](https://github.com/Auroriax/js13k-2020/blob/master/tomato.js). And programming in JavaScript with a live reload plug-in is absolutely a blast thanks to the blazingly fast iteration time.

And, of course, a seed for a game idea. I've made a [couple](https://auroriax.itch.io/pp) [Sokoban](https://auroriax.itch.io/sokobanana) [variants](https://auroriax.itch.io/necroban) [before](https://auroriax.itch.io/tahiras-tower), and my next idea was to have the level continue infinitely into all directions. **A small spoiler warning, though: I'll vaguely describe some of the puzzle mechanics (though no puzzle solutions!) in this postmortem, so you might [want to play the game a bit](https://auroriax.itch.io/edge-not-found) before reading on.**

# Programming

A level in this game is defined with a 2D array to set up the grid and some metadata such as the level name, but also shift offsets that are used for later levels. I think undo is the most important functionality any puzzle game should support, and as such I built the game up in a way where the game & rendering logic are separated to make that possible.

![Definition of the level in code, next to the level as it displays in the game.](https://auroriax.com/wp-content/uploads/2020/09/Screenshot_10-1024x338.png)

The rectangular border in the middle of the screen indicates the only part of the level that actually exists. If you walk through the border, as far as the level state is concerned, you've wrapped to the other side of the level. There's some math to decide where you should end up if the level is "shifted" (the level grid is not uniformly aligned).

One thing I attempted to implement was pathfinding. Lately, a number of Sokoban-style puzzle games have popped up that allow players to click or tap a location and have the character figure out how to walk over there. I really wanted to have this feature, but A* pathfinding was not intended for infinite grids. I really want to implement this for my next puzzle game, though.

![Full source code of the submitted version of Edge Not Found.](https://auroriax.com/wp-content/uploads/2020/09/Screenshot_9-1024x575.png)

# Optimization

Make no mistake: even code that fits on a floppy disk can be incredibly slow when drawing a lot of things to the screen. At first I drew a rough.js primitive for every block on the screen, which is where this limitation became evident. Then, I drew the shapes to a level canvas, which is then drawn as an image and repeated across the screen. This was better, but still slow on levels with a lot of objects. So then I also drew all individual objects to their own canvases, drew those onto the level, then drew that repeatedly on the main canvas. Also, the game now attempts to skip rendering when nothing changes, using the object-level-main canvas technique described above, and that caused a more significant improvement than I originally expected.

A nice benefit is that all of this makes it really easy to support multiple color palettes, too. I made a couple of nice ones, including one based on Okinaki (my favorite color theme in N++) and BackFlipped, a theme with the color palette [from my previous entry.](http://js13kgames.com/entries/backflipped)

![Screenshot of the game with the Ikaniko color palette.](https://auroriax.com/wp-content/uploads/2020/09/canvas-1024x527.jpg)

I made a linter for my entry last year, but [I expanded it for this game](https://github.com/Auroriax/js13k-2020/blob/master/builds/ml.html), and mostly re-purposed it as a way to put multiple JavaScript files in a single file to minify it elsewhere, Google Closure Compiler in my case. Last year I had a lot of trouble with the Closure Compiler, but because of my choices of libraries combined with a better coding style, it worked with minimal hiccups this time around, allowing for a bit more content. Ultimately, I was able to minify around 79kb of files to just below 13kb zipped.

# Level design

Making puzzles for this game took a lot of iteration, but overall I'm really happy with the level of puzzle quality in Edge Not Found. I iterated a lot and kept the very best levels, and made sure to enforce the intended solution. In world 1 and 2 you're still getting used to the wrapping world and the puzzles are easy: the wrapped grid makes sure that the possibility space is bigger than in an ordinary version of Sokoban because it's easier to retrieve blocks from tight corners in this game. But everything from 300 onward showcases very interesting properties of the system that are really fun and mind-bending to discover, and in some cases allow for very hard puzzles. I am still a bit divided on the new mechanic introduced in the final world, which I would preferably have introduced earlier, but since it mostly exists to compliment the other mechanics in the game, it does make for a fitting finale of the game together with level 404.

![Level 301 of Edge Not Found.](https://auroriax.com/wp-content/uploads/2020/09/enf_301-1024x527.jpg)

I especially love how the level select came together. Initially, I was planning for the [Esc] menu to be used for navigate between levels, but procrastination hit me hard. I ended up implementing it as a regular level instead, allowing me more control over in which order the player could play the levels.

![Level Select of Edge Not Found.](https://auroriax.com/wp-content/uploads/2020/09/end_levelselect-1024x379.png)

Initially, all levels could be accessed at the start of the game. I decided to gate it slightly, to make for a smoother difficulty curve and a better sense of progression. You don't have to beat all of the levels to continue, since some of them are really hard and I want players to have a realistic chance to unlock level 404 and finish the game. The main problem that spawned out of this is that the level select would become so big, it would no longer fit on the screen. That's how I ended up with the current tight design, which already teases the mechanics of level 200 a little bit if you pay attention.

# Conclusion

I had a blast making this game, and the reception also seems a lot better than for my entry last year. It was a great test run for my mini framework Tomato, and I worked out a lot of the kinks for the first game using it. I'm certainly looking forward to doing more projects like Edge Not Found, and I'm really curious to how it will do in the js13k voting.

If you have some time and are now really excited about playing the game, you can play either the [contest submission](https://js13kgames.com/games/edge-not-found/index.html) or the [itch version](https://auroriax.itch.io/edge-not-found)! Thank you for reading.
