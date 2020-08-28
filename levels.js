var levels = [];
levels[0] = [
    {name: "Tumbling Tetronimos"}, //Hey, it's a normal Sokoban puzzle!
    "#######",
    "#.p...#",
    "#.t#b.#",
    "#..#..#",
    "#.b#t.#",
    "#.....#",
    "#######"
]
levels[1] = [
    {name: "Diabolical DNA"}, //Needs to be harder
    "..#..",
    "..tb.",
    ".#.#.",
    ".bt..",
    "..#.."
]
levels[2] = [
    {name: "Glass Hallway"}, //Too easy to be interesting
    "##b##",
    "#.t.#",
    "b.b..",
    "#tpt#",
    "##.##"
]
levels[3] = [ //Decent easy level, rdddlldddlruuuulldrllddru (25)
    {name: "Infinite Inlet"},
    "..#.",
    "p.#.",
    ".tbt",
    "#b.b",
    ".tbt",
]
levels[4] = [
    {name: "Continuous Corridor", yOff: 3}, //ldurrdrrrrrurrrrrrrrrdrullldrrulllllldduurrrrdlllullldlllurrrr (62)
    "#######",
    "t....p.",
    "t..b.b.",
    ".######",
    "t#.b.b.",
    "t.....#"
]
levels[5] = [
    {name: "Twisted Terrace", xOff: 3}, //uuulllllrrddduuuuuuddddddlrrluuurrruuuuuullrrddddddllrrdulllu (61)
    "b.....",
    ".##.##",
    ".#.t.#",
    "bbtptb",
    ".#.t.#",
    ".##.##"
]
levels[6] = [
    {name: "Uncornered", yOff: 1}, //dldddrrrrrllllluuurulll (23)
    ".p....",
    ".#.t..",
    ".####.",
    ".#....",
    "...b..",
    "######",
]
levels[7] = [
    {name: "Box of Memories", yOff: 1}, //lrluuddurudrudrdrldrulululllldduulrddduuruluurdldulllldluuurul (62). Lots of busywork and very easy if you know the initial trick
    "bbbbb",
    "bttt.",
    "btpt.",
    "bttt.",
]

var level = 0;

/*

*/