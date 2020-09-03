var levels = [];
levels.push([
    {xOff: 0}, //Level select
    "###...###",
    "pl.......",
    "l.l......",
    ".l..l....",
    "...l.l...",
    "....l..l.",
    "......l.l",
    "......l.l",
    ".......l.",
    "###...###",
]);
levels.push([
    {name: "A Wrapping World"}, //Hey, it's a normal Sokoban puzzle! Sorta.
    "#####.#",
    "......#",
    "...#..#",
    "#.###.#",
    ".b#t.p.",
    "..###.#",
]);
levels.push([
    {name: "Glass Hallway"}, //Too easy to be interesting
    "##b##",
    "#.t.#",
    "b.b..",
    "#tpt#",
    "##.##"
]);
/*levels.push([
    {name: "Diabolical DNA"}, //Needs to be harder
    "..#..",
    "b.t##",
    "p#.#.",
    "##t.b",
    "..#.."
])*/
levels.push([ //Decent easy level, rdddlldddlruuuulldrllddru (25)
    {name: "Infinite Inlet"},
    "..#.",
    "p.#.",
    ".tbt",
    "#b.b",
    ".tbt",
]);
levels.push([
    {name: "Girded Grid"}, //uurruullllddrrudrruullddlluuuuudrrddrruuudrrddlruurrddl ( ~50)
    ".#.#.#",
    "t.b.t.",
    ".#.#.#",
    "b.p.b.",
    ".#.#.#",
    "t.b.t."
]);
levels.push([
    {name: "Wrap Around The Block", yOff: 2}, //Wrap offset introduction puzzle
    "....",
    "####",
    "...b",
    "####",
    ".t#p",
    "####"
]);
levels.push([
    {name: "Twisted Terrace", xOff: 3}, //uuulllllrrddduuuuuuddddddlrrluuurrruuuuuullrrddddddllrrdulllu (61)
    "b..p..",
    ".##.##",
    ".#.t.#",
    "bbt.tb",
    ".#.t.#",
    ".##.##"
]);
levels.push([
    {name: "Continuous Corridor", yOff: 3}, //ldurrdrrrrrurrrrrrrrrdrullldrrulllllldduurrrrdlllullldlllurrrr (62)
    "#######",
    "t....p.",
    "t..b.b.",
    ".######",
    "t#.b.b.",
    "t.....#"
]);
/*levels.push([
    {name: "Twisted Terrace"}, //uuulllllrrddduuuuuuddddddlrrluuurrruuuuuullrrddddddllrrdulllu (61)
    "b..t..",
    ".#tpt#",
    "bb.t.b"
]);*/
levels.push([
    {name: "Crowned Conundrum", xOff: 3}, //uuulllllrrddduuuuuuddddddlrrluuurrruuuuuullrrddddddllrrdulllu (61)
    "pb...b",
    "b#.#.#",
    ".#ttt#",
]);
/*levels.push([
    {name: "Cracking Crowns v2", xOff: 3}, 
    "pb.t.b",
    "b#t.t#",
]);*/
levels.push([
    {name: "Sift & Shift"}, //Tutorial level for introducing the shifters
    "bt##|#",
    "###p..",
    "####.#"
]);
levels.push([
    {name: "Cornered Contraption", yOff: 1}, //drrrrrrrlllllurdruulurrrrdrruulrddllurdrulurrrrrurdldrr (55)
    "p....",
    ".|...",
    "#####",
    ".t#..",
    "###.."
]);
levels.push([
    {name: "Irregular Infrastructure", yOff: 2}, //urullulddddddldrurdldrrrrdrdddddddddddrdllllluldddddrdlllllulddddrdlll (70)
    "##..|",
    ".#..p",
    ".#..#",
    ".#.#t",
    "....#",
    "....."
]);
levels.push([
    {name: "Riddle Raster", yOff: -1}, //rDullllluLLLLLLLLLLDuuuurRurDrrrddllLUdDudDrrurrRllU (50)
    "...",
    ".t.",
    "#|#",
    ".t.",
    "#b#",
    "pt.",
    "#|#",
]);
levels.push([
    {name: "Enchanted Maze"}, //ldRuluRdrUUUUUluRRluuuulluuuUruLLrUUUddllldRRllduurrrrlDDDDDuuuullldRRurDDDD (76)
    "##.#.###.#.#",
    "#..-..#....#",
    "#..p..#.t.t.",
    "#..-..##....",
    "##.#.###.#.#",
]);
levels.push([
    {name: "Numbered Lock", yOff: -2}, //lrrlluurrDLLLLLLLdlUUrrdddrrrrrddrruLdlUUlluulllluuulluurDDldRRddrrrrruurDDllllLulDuullllllllllullldRRRRRRRRRRRurDrddrddlUluluurlddrRuulDrdRRRlllulldRRRR (153)
    "#########",
    "####..###",
    ".......##",
    "####....#",
    "####.....",
    "....#...#",
    "#....#...",
    "...||.###",
    "##.p.....",
    "tt#...###",
]);
levels.push([
    {name: "Rubble Rundown"}, //rDullllluLLLLLLLLLLDuuuurRurDrrrddllLUdDudDrrurrRllU (50)
    "###...#",
    ".pb..rt",
    "#######"
]);
levels.push([
    {name: "Questionable Quaternions", yOff: 2}, //Blueprint of what could be a good idea (that does take up a lotta space though)
    ".....###",
    ".#...#tr",
    "rtr..#|r",
    "r|r..#r.",
    ".r...#|r",
    ".....#tr",
    ".#######",
    ".#tt#...",
    ".r||r...",
]);
/*
levels.push([
    {name: "Stuck Shifter"}, //Idea is good but it is messy, needs player target to have potential
    "bbrr.b",
    "br.+rb",
    "p.r.r.",
    "bb.r.b"
]);*/

var level = 0;

/*levels.push([
    {name: "Stuck Shifter V2", yOff: -1}, //Idea behind this puzzle was to push an | horizontally across multiple screen wraps
    "........",
    "#t......",
    "........",
    "......|.",
    "........",
    "........",
    "........",
    "........",
    "........",
]);*/
/*levels.push([
    {name: "Fixing tweening bugs", xOff: 3}, //uuulllllrrddduuuuuuddddddlrrluuurrruuuuuullrrddddddllrrdulllu (61)
    "b......",
    ".##.##",
    ".#.t.#",
    "bbtptb",
    ".#.t.#",
    "......"
]);*/

//VIABLE
/*levels.push([
    {name: "Uncornered", yOff: 1}, //dldddrrrrrllllluuurulll (23)
    ".p....",
    ".#.t..",
    ".####.",
    ".#....",
    "...b..",
    "######",
])
levels.push([
    {name: "Box of Memories", yOff: 1}, //lrluuddurudrudrdrldrulululllldduulrddduuruluurdldulllldluuurul (62). Lots of busywork and very easy if you know the initial trick
    "bbbbb",
    "bttt.",
    "btpt.",
    "bttt.",
])*/

//DISCARDED
/*
levels[0] = [
    {name: "Tumbling Tetronimos"}, //Hey, it's a normal Sokoban puzzle!
    "####..#",
    "#.....#",
    "#..##.#",
    "#..##.#",
    "pb.##.#",
    "#..##t#",
    "#######"
]

levels[2] = [
    {name: "Diabolical DNA", yOff: 2}, //Needs to be harder
    ".t..",
    "tbt.",
    "bbbt"
]

levels[2] = [
    {name: "Diabolical DNA", yOff: 1}, //Needs to be harder
    "btb",
    "tpt",
    "btb"
]
*/