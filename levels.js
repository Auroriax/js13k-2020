var levels = [];
levels[0] = [
    {name: "Tumbling Tetronimos"}, //Should change into a tutorial puzzle of sorts
    "##..",
    ".bp.",
    ".#..",
    "...4",
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
    "#t.t#",
    "b.p..",
    "#.bt#",
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
    {name: "Continuous Corridor", xOff: 3}, //Barely a sample at the moment, but could be interesting to explore
    "#########",
    ".........",
    ".........",
    "p########",
    ".........",
    "........."
]
levels[5] = [
    {name: "Twisted Terrace", xOff: 3}, //Almost solveable, need to make a minor change for it to work
    "b.....",
    ".##.##",
    ".#.t.#",
    "bbtptb",
    ".#.t.#",
    ".##.##"
]
levels[6] = [
    {name: "Uncornered", yOff: 1},
    "######",
    ".p.t..",
    "......",
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

var level = 7;