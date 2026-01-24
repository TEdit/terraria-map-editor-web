const PAINTS = [
    { id: 0, name: "None", color: "#00000000" },
    // Non-deep paints, lightened ~25% toward white
    { id: 1, name: "Red", color: "#FFFF4040" },
    { id: 2, name: "Orange", color: "#FFFF9F40" },
    { id: 3, name: "Yellow", color: "#FFFFFF40" },
    { id: 4, name: "Lime", color: "#FF9FFF40" },
    { id: 5, name: "Green", color: "#FF40FF40" },
    { id: 6, name: "Teal", color: "#FF40FF9F" },
    { id: 7, name: "Cyan", color: "#FF40FFFF" },
    { id: 8, name: "Sky Blue", color: "#FF409FFF" },
    { id: 9, name: "Blue", color: "#FF4040FF" },
    { id: 10, name: "Purple", color: "#FF9F40FF" },
    { id: 11, name: "Violet", color: "#FFFF40FF" },
    { id: 12, name: "Pink", color: "#FFFF409F" },
    // Deep paints
    { id: 13, name: "Deep Red", color: "#FFFF0000" },
    { id: 14, name: "Deep Orange", color: "#FFFF7F00" },
    { id: 15, name: "Deep Yellow", color: "#FFFFFF00" },
    { id: 16, name: "Deep Lime", color: "#FF7FFF00" },
    { id: 17, name: "Deep Green", color: "#FF00FF00" },
    { id: 18, name: "Deep Teal", color: "#FF00FF7F" },
    { id: 19, name: "Deep Cyan", color: "#FF00FFFF" },
    { id: 20, name: "Deep Sky Blue", color: "#FF007FFF" },
    { id: 21, name: "Deep Blue", color: "#FF0000FF" },
    { id: 22, name: "Deep Purple", color: "#FF7F00FF" },
    { id: 23, name: "Deep Violet", color: "#FFFF00FF" },
    { id: 24, name: "Deep Pink", color: "#FFFF007F" },
    { id: 25, name: "Black", color: "#FF4B4B4B" },
    { id: 26, name: "White", color: "#FFFFFFFF" },
    { id: 27, name: "Gray", color: "#FFAFAFAF" },
    { id: 28, name: "Brown", color: "#FFFFB27D" },
    { id: 29, name: "Shadow", color: "#FF191919" },
    { id: 30, name: "Negative", color: "#FFFFFFFF" },
    { id: 31, name: "Illuminant Paint (legacy)", color: "#FFFFFFFF" }
];

export default Object.freeze(PAINTS);
