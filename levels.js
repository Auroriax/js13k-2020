var levels = [];
levels.push([
    {}, //Level select
    "########",
    "l.l.l.l.",
    "...p....",
    "........",
    "l.l.l.l.",
    "########",
]);
levels.push([
    {name: "A Wrapping World"}, //Hey, it's a normal Sokoban puzzle!
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
    {name: "Continuous Corridor", yOff: 3}, //ldurrdrrrrrurrrrrrrrrdrullldrrulllllldduurrrrdlllullldlllurrrr (62)
    "#######",
    "t....p.",
    "t..b.b.",
    ".######",
    "t#.b.b.",
    "t.....#"
]);
levels.push([
    {name: "Twisted Terrace", xOff: 3}, //uuulllllrrddduuuuuuddddddlrrluuurrruuuuuullrrddddddllrrdulllu (61)
    "b.....",
    ".##.##",
    ".#.t.#",
    "bbtptb",
    ".#.t.#",
    ".##.##"
]);
levels.push([
    {name: "Cracking Crowns", xOff: 3}, //uuulllllrrddduuuuuuddddddlrrluuurrruuuuuullrrddddddllrrdulllu (61)
    "pb...b",
    "b#.#.#",
    ".#ttt#",
]);
levels.push([
    {name: "Cracking Crowns v2", xOff: 3}, //uuulllllrrddduuuuuuddddddlrrluuurrruuuuuullrrddddddllrrdulllu (61)
    "pb.t.b",
    "b#t.t#",
]);
/*levels.push([
    {name: "Fixing tweening bugs", xOff: 3}, //uuulllllrrddduuuuuuddddddlrrluuurrruuuuuullrrddddddllrrdulllu (61)
    "b......",
    ".##.##",
    ".#.t.#",
    "bbtptb",
    ".#.t.#",
    "......"
]);*/

var level = 0;

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