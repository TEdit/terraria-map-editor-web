import LAYERS from "./enum-LAYERS.js";

let pointColors = {};

pointColors[LAYERS.TILES] = [
    {"r":151,"g":107,"b":75},
    {"r":128,"g":128,"b":128},
    {"r":28,"g":216,"b":94},
    {"r":27,"g":197,"b":109},
    {"r":253,"g":221,"b":3},
    {"r":104,"g":76,"b":55},
    {"r":140,"g":101,"b":80},
    {"r":150,"g":67,"b":22},
    {"r":185,"g":164,"b":23},
    {"r":185,"g":194,"b":195},
    {"r":119,"g":105,"b":79},
    {"r":119,"g":105,"b":79},
    {"r":174,"g":24,"b":69},
    {"r":133,"g":213,"b":247},
    {"r":191,"g":142,"b":111},
    {"r":191,"g":142,"b":111},
    {"r":140,"g":130,"b":116},
    {"r":144,"g":148,"b":144},
    {"r":191,"g":142,"b":111},
    {"r":191,"g":142,"b":111},
    {"r":163,"g":116,"b":81},
    {"r":233,"g":207,"b":94},
    {"r":98,"g":95,"b":167},
    {"r":141,"g":137,"b":223},
    {"r":122,"g":116,"b":218},
    {"r":109,"g":90,"b":128},
    {"r":119,"g":101,"b":125},
    {"r":226,"g":196,"b":49},
    {"r":151,"g":79,"b":80},
    {"r":175,"g":105,"b":128},
    {"r":170,"g":120,"b":84},
    {"r":141,"g":120,"b":168},
    {"r":151,"g":135,"b":183},
    {"r":253,"g":221,"b":3},
    {"r":235,"g":166,"b":135},
    {"r":197,"g":216,"b":219},
    {"r":230,"g":89,"b":92},
    {"r":104,"g":86,"b":84},
    {"r":144,"g":144,"b":144},
    {"r":181,"g":62,"b":59},
    {"r":146,"g":81,"b":68},
    {"r":66,"g":84,"b":109},
    {"r":251,"g":235,"b":127},
    {"r":84,"g":100,"b":63},
    {"r":107,"g":68,"b":99},
    {"r":185,"g":164,"b":23},
    {"r":185,"g":194,"b":195},
    {"r":150,"g":67,"b":22},
    {"r":128,"g":128,"b":128},
    {"r":43,"g":143,"b":255},
    {"r":170,"g":48,"b":114},
    {"r":192,"g":202,"b":203},
    {"r":23,"g":177,"b":76},
    {"r":255,"g":218,"b":56},
    {"r":200,"g":246,"b":254},
    {"r":191,"g":142,"b":111},
    {"r":43,"g":40,"b":84},
    {"r":68,"g":68,"b":76},
    {"r":142,"g":66,"b":66},
    {"r":92,"g":68,"b":73},
    {"r":143,"g":215,"b":29},
    {"r":135,"g":196,"b":26},
    {"r":121,"g":176,"b":24},
    {"r":110,"g":140,"b":182},
    {"r":196,"g":96,"b":114},
    {"r":56,"g":150,"b":97},
    {"r":160,"g":118,"b":58},
    {"r":140,"g":58,"b":166},
    {"r":125,"g":191,"b":197},
    {"r":190,"g":150,"b":92},
    {"r":93,"g":127,"b":255},
    {"r":182,"g":175,"b":130},
    {"r":182,"g":175,"b":130},
    {"r":27,"g":197,"b":109},
    {"r":96,"g":197,"b":27},
    {"r":36,"g":36,"b":36},
    {"r":142,"g":66,"b":66},
    {"r":238,"g":85,"b":70},
    {"r":121,"g":110,"b":97},
    {"r":191,"g":142,"b":111},
    {"r":73,"g":120,"b":17},
    {"r":245,"g":133,"b":191},
    {"r":255,"g":120,"b":0},
    {"r":255,"g":120,"b":0},
    {"r":255,"g":120,"b":0},
    {"r":192,"g":192,"b":192},
    {"r":191,"g":142,"b":111},
    {"r":191,"g":142,"b":111},
    {"r":191,"g":142,"b":111},
    {"r":191,"g":142,"b":111},
    {"r":144,"g":148,"b":144},
    {"r":13,"g":88,"b":130},
    {"r":213,"g":229,"b":237},
    {"r":253,"g":221,"b":3},
    {"r":191,"g":142,"b":111},
    {"r":255,"g":162,"b":31},
    {"r":144,"g":148,"b":144},
    {"r":144,"g":148,"b":144},
    {"r":253,"g":221,"b":3},
    {"r":144,"g":148,"b":144},
    {"r":253,"g":221,"b":3},
    {"r":191,"g":142,"b":111},
    {"r":229,"g":212,"b":73},
    {"r":141,"g":98,"b":77},
    {"r":191,"g":142,"b":111},
    {"r":144,"g":148,"b":144},
    {"r":191,"g":142,"b":111},
    {"r":11,"g":80,"b":143},
    {"r":91,"g":169,"b":169},
    {"r":78,"g":193,"b":227},
    {"r":48,"g":186,"b":135},
    {"r":128,"g":26,"b":52},
    {"r":103,"g":98,"b":122},
    {"r":48,"g":208,"b":234},
    {"r":191,"g":142,"b":111},
    {"r":33,"g":171,"b":207},
    {"r":238,"g":225,"b":218},
    {"r":181,"g":172,"b":190},
    {"r":238,"g":225,"b":218},
    {"r":107,"g":92,"b":108},
    {"r":92,"g":68,"b":73},
    {"r":11,"g":80,"b":143},
    {"r":91,"g":169,"b":169},
    {"r":106,"g":107,"b":118},
    {"r":73,"g":51,"b":36},
    {"r":141,"g":175,"b":255},
    {"r":159,"g":209,"b":229},
    {"r":128,"g":204,"b":230},
    {"r":191,"g":142,"b":111},
    {"r":255,"g":117,"b":224},
    {"r":160,"g":160,"b":160},
    {"r":52,"g":52,"b":52},
    {"r":144,"g":148,"b":144},
    {"r":231,"g":53,"b":56},
    {"r":166,"g":187,"b":153},
    {"r":253,"g":114,"b":114},
    {"r":213,"g":203,"b":204},
    {"r":144,"g":148,"b":144},
    {"r":96,"g":96,"b":96},
    {"r":191,"g":142,"b":111},
    {"r":98,"g":95,"b":167},
    {"r":192,"g":59,"b":59},
    {"r":144,"g":148,"b":144},
    {"r":144,"g":148,"b":144},
    {"r":144,"g":148,"b":144},
    {"r":192,"g":30,"b":30},
    {"r":43,"g":192,"b":30},
    {"r":211,"g":236,"b":241},
    {"r":181,"g":211,"b":210},
    {"r":220,"g":50,"b":50},
    {"r":128,"g":26,"b":52},
    {"r":190,"g":171,"b":94},
    {"r":128,"g":133,"b":184},
    {"r":239,"g":141,"b":126},
    {"r":190,"g":171,"b":94},
    {"r":131,"g":162,"b":161},
    {"r":170,"g":171,"b":157},
    {"r":104,"g":100,"b":126},
    {"r":145,"g":81,"b":85},
    {"r":148,"g":133,"b":98},
    {"r":0,"g":0,"b":200},
    {"r":144,"g":195,"b":232},
    {"r":184,"g":219,"b":240},
    {"r":174,"g":145,"b":214},
    {"r":218,"g":182,"b":204},
    {"r":100,"g":100,"b":100},
    {"r":129,"g":125,"b":93},
    {"r":62,"g":82,"b":114},
    {"r":132,"g":157,"b":127},
    {"r":152,"g":171,"b":198},
    {"r":228,"g":219,"b":162},
    {"r":33,"g":135,"b":85},
    {"r":181,"g":194,"b":217},
    {"r":253,"g":221,"b":3},
    {"r":253,"g":221,"b":3},
    {"r":129,"g":125,"b":93},
    {"r":132,"g":157,"b":127},
    {"r":152,"g":171,"b":198},
    {"r":255,"g":0,"b":255},
    {"r":49,"g":134,"b":114},
    {"r":126,"g":134,"b":49},
    {"r":134,"g":59,"b":49},
    {"r":43,"g":86,"b":140},
    {"r":121,"g":49,"b":134},
    {"r":100,"g":100,"b":100},
    {"r":149,"g":149,"b":115},
    {"r":255,"g":0,"b":255},
    {"r":255,"g":0,"b":255},
    {"r":73,"g":120,"b":17},
    {"r":223,"g":255,"b":255},
    {"r":182,"g":175,"b":130},
    {"r":104,"g":76,"b":55},
    {"r":26,"g":196,"b":84},
    {"r":56,"g":121,"b":255},
    {"r":157,"g":157,"b":107},
    {"r":134,"g":22,"b":34},
    {"r":147,"g":144,"b":178},
    {"r":97,"g":200,"b":225},
    {"r":62,"g":61,"b":52},
    {"r":208,"g":80,"b":80},
    {"r":216,"g":152,"b":144},
    {"r":203,"g":61,"b":64},
    {"r":213,"g":178,"b":28},
    {"r":128,"g":44,"b":45},
    {"r":125,"g":55,"b":65},
    {"r":186,"g":50,"b":52},
    {"r":124,"g":175,"b":201},
    {"r":144,"g":148,"b":144},
    {"r":88,"g":105,"b":118},
    {"r":144,"g":148,"b":144},
    {"r":192,"g":59,"b":59},
    {"r":191,"g":233,"b":115},
    {"r":144,"g":148,"b":144},
    {"r":137,"g":120,"b":67},
    {"r":103,"g":103,"b":103},
    {"r":254,"g":121,"b":2},
    {"r":191,"g":142,"b":111},
    {"r":144,"g":148,"b":144},
    {"r":144,"g":148,"b":144},
    {"r":144,"g":148,"b":144},
    {"r":144,"g":148,"b":144},
    {"r":239,"g":90,"b":50},
    {"r":231,"g":96,"b":228},
    {"r":57,"g":85,"b":101},
    {"r":107,"g":132,"b":139},
    {"r":227,"g":125,"b":22},
    {"r":141,"g":56,"b":0},
    {"r":255,"g":255,"b":255},
    {"r":144,"g":148,"b":144},
    {"r":255,"g":156,"b":12},
    {"r":131,"g":79,"b":13},
    {"r":224,"g":194,"b":101},
    {"r":145,"g":81,"b":85},
    {"r":255,"g":0,"b":255},
    {"r":53,"g":44,"b":41},
    {"r":214,"g":184,"b":46},
    {"r":149,"g":232,"b":87},
    {"r":255,"g":241,"b":51},
    {"r":225,"g":128,"b":206},
    {"r":224,"g":194,"b":101},
    {"r":99,"g":50,"b":30},
    {"r":77,"g":74,"b":72},
    {"r":99,"g":50,"b":30},
    {"r":140,"g":179,"b":254},
    {"r":200,"g":245,"b":253},
    {"r":99,"g":50,"b":30},
    {"r":99,"g":50,"b":30},
    {"r":140,"g":150,"b":150},
    {"r":219,"g":71,"b":38},
    {"r":249,"g":52,"b":243},
    {"r":76,"g":74,"b":83},
    {"r":235,"g":150,"b":23},
    {"r":153,"g":131,"b":44},
    {"r":57,"g":48,"b":97},
    {"r":248,"g":158,"b":92},
    {"r":107,"g":49,"b":154},
    {"r":154,"g":148,"b":49},
    {"r":49,"g":49,"b":154},
    {"r":49,"g":154,"b":68},
    {"r":154,"g":49,"b":77},
    {"r":85,"g":89,"b":118},
    {"r":154,"g":83,"b":49},
    {"r":221,"g":79,"b":255},
    {"r":250,"g":255,"b":79},
    {"r":79,"g":102,"b":255},
    {"r":79,"g":255,"b":89},
    {"r":255,"g":79,"b":79},
    {"r":240,"g":240,"b":247},
    {"r":255,"g":145,"b":79},
    {"r":191,"g":142,"b":111},
    {"r":122,"g":217,"b":232},
    {"r":122,"g":217,"b":232},
    {"r":121,"g":119,"b":101},
    {"r":128,"g":128,"b":128},
    {"r":190,"g":171,"b":94},
    {"r":122,"g":217,"b":232},
    {"r":122,"g":217,"b":232},
    {"r":122,"g":217,"b":232},
    {"r":122,"g":217,"b":232},
    {"r":122,"g":217,"b":232},
    {"r":122,"g":217,"b":232},
    {"r":122,"g":217,"b":232},
    {"r":122,"g":217,"b":232},
    {"r":128,"g":128,"b":128},
    {"r":150,"g":67,"b":22},
    {"r":122,"g":217,"b":232},
    {"r":122,"g":217,"b":232},
    {"r":79,"g":128,"b":17},
    {"r":122,"g":217,"b":232},
    {"r":122,"g":217,"b":232},
    {"r":122,"g":217,"b":232},
    {"r":122,"g":217,"b":232},
    {"r":122,"g":217,"b":232},
    {"r":122,"g":217,"b":232},
    {"r":122,"g":217,"b":232},
    {"r":122,"g":217,"b":232},
    {"r":122,"g":217,"b":232},
    {"r":122,"g":217,"b":232},
    {"r":122,"g":217,"b":232},
    {"r":122,"g":217,"b":232},
    {"r":144,"g":148,"b":144},
    {"r":144,"g":148,"b":144},
    {"r":144,"g":148,"b":144},
    {"r":144,"g":148,"b":144},
    {"r":144,"g":148,"b":144},
    {"r":144,"g":148,"b":144},
    {"r":144,"g":148,"b":144},
    {"r":144,"g":148,"b":144},
    {"r":144,"g":148,"b":144},
    {"r":122,"g":217,"b":232},
    {"r":122,"g":217,"b":232},
    {"r":117,"g":61,"b":25},
    {"r":204,"g":93,"b":73},
    {"r":87,"g":150,"b":154},
    {"r":181,"g":164,"b":125},
    {"r":235,"g":114,"b":80},
    {"r":122,"g":217,"b":232},
    {"r":122,"g":217,"b":232},
    {"r":122,"g":217,"b":232},
    {"r":96,"g":68,"b":48},
    {"r":203,"g":185,"b":151},
    {"r":96,"g":77,"b":64},
    {"r":198,"g":170,"b":104},
    {"r":182,"g":141,"b":86},
    {"r":228,"g":213,"b":173},
    {"r":129,"g":125,"b":93},
    {"r":9,"g":61,"b":191},
    {"r":253,"g":32,"b":3},
    {"r":200,"g":246,"b":254},
    {"r":15,"g":15,"b":15},
    {"r":226,"g":118,"b":76},
    {"r":161,"g":172,"b":173},
    {"r":204,"g":181,"b":72},
    {"r":190,"g":190,"b":178},
    {"r":191,"g":142,"b":111},
    {"r":217,"g":174,"b":137},
    {"r":253,"g":62,"b":3},
    {"r":144,"g":148,"b":144},
    {"r":85,"g":255,"b":160},
    {"r":122,"g":217,"b":232},
    {"r":96,"g":248,"b":2},
    {"r":105,"g":74,"b":202},
    {"r":29,"g":240,"b":255},
    {"r":254,"g":202,"b":80},
    {"r":131,"g":252,"b":245},
    {"r":255,"g":156,"b":12},
    {"r":149,"g":212,"b":89},
    {"r":236,"g":74,"b":79},
    {"r":44,"g":26,"b":233},
    {"r":144,"g":148,"b":144},
    {"r":55,"g":97,"b":155},
    {"r":31,"g":31,"b":31},
    {"r":238,"g":97,"b":94},
    {"r":28,"g":216,"b":94},
    {"r":141,"g":107,"b":89},
    {"r":141,"g":107,"b":89},
    {"r":233,"g":203,"b":24},
    {"r":168,"g":178,"b":204},
    {"r":122,"g":217,"b":232},
    {"r":122,"g":217,"b":232},
    {"r":122,"g":217,"b":232},
    {"r":122,"g":217,"b":232},
    {"r":122,"g":217,"b":232},
    {"r":122,"g":217,"b":232},
    {"r":122,"g":217,"b":232},
    {"r":146,"g":136,"b":205},
    {"r":223,"g":232,"b":233},
    {"r":168,"g":178,"b":204},
    {"r":50,"g":46,"b":104},
    {"r":50,"g":46,"b":104},
    {"r":127,"g":116,"b":194},
    {"r":249,"g":101,"b":189},
    {"r":252,"g":128,"b":201},
    {"r":9,"g":61,"b":191},
    {"r":253,"g":32,"b":3},
    {"r":255,"g":156,"b":12},
    {"r":160,"g":120,"b":92},
    {"r":191,"g":142,"b":111},
    {"r":160,"g":120,"b":100},
    {"r":251,"g":209,"b":240},
    {"r":191,"g":142,"b":111},
    {"r":254,"g":121,"b":2},
    {"r":28,"g":216,"b":94},
    {"r":221,"g":136,"b":144},
    {"r":131,"g":206,"b":12},
    {"r":87,"g":21,"b":144},
    {"r":127,"g":92,"b":69},
    {"r":127,"g":92,"b":69},
    {"r":127,"g":92,"b":69},
    {"r":127,"g":92,"b":69},
    {"r":253,"g":32,"b":3},
    {"r":122,"g":217,"b":232},
    {"r":122,"g":217,"b":232},
    {"r":122,"g":217,"b":232},
    {"r":122,"g":217,"b":232},
    {"r":191,"g":142,"b":111},
    {"r":198,"g":124,"b":78},
    {"r":212,"g":192,"b":100},
    {"r":100,"g":82,"b":126},
    {"r":77,"g":76,"b":66},
    {"r":96,"g":68,"b":117},
    {"r":68,"g":60,"b":51},
    {"r":174,"g":168,"b":186},
    {"r":205,"g":152,"b":186},
    {"r":140,"g":84,"b":60},
    {"r":140,"g":140,"b":140},
    {"r":120,"g":120,"b":120},
    {"r":255,"g":227,"b":132},
    {"r":85,"g":83,"b":82},
    {"r":85,"g":83,"b":82},
    {"r":75,"g":139,"b":166},
    {"r":227,"g":46,"b":46},
    {"r":75,"g":139,"b":166},
    {"r":122,"g":217,"b":232},
    {"r":122,"g":217,"b":232},
    {"r":249,"g":75,"b":7},
    {"r":0,"g":160,"b":170},
    {"r":160,"g":87,"b":234},
    {"r":22,"g":173,"b":254},
    {"r":117,"g":125,"b":151},
    {"r":255,"g":255,"b":255},
    {"r":73,"g":70,"b":70},
    {"r":73,"g":70,"b":70},
    {"r":255,"g":255,"b":255},
    {"r":146,"g":155,"b":187},
    {"r":174,"g":195,"b":215},
    {"r":77,"g":11,"b":35},
    {"r":119,"g":22,"b":52},
    {"r":255,"g":255,"b":255},
    {"r":63,"g":63,"b":63},
    {"r":23,"g":119,"b":79},
    {"r":23,"g":54,"b":119},
    {"r":119,"g":68,"b":23},
    {"r":74,"g":23,"b":119},
    {"r":78,"g":82,"b":109},
    {"r":39,"g":168,"b":96},
    {"r":39,"g":94,"b":168},
    {"r":168,"g":121,"b":39},
    {"r":111,"g":39,"b":168},
    {"r":150,"g":148,"b":174},
    {"r":255,"g":255,"b":255},
    {"r":255,"g":255,"b":255},
    {"r":3,"g":144,"b":201},
    {"r":123,"g":123,"b":123},
    {"r":191,"g":176,"b":124},
    {"r":55,"g":55,"b":73},
    {"r":255,"g":66,"b":152},
    {"r":179,"g":132,"b":255},
    {"r":0,"g":206,"b":180},
    {"r":91,"g":186,"b":240},
    {"r":92,"g":240,"b":91},
    {"r":240,"g":91,"b":147},
    {"r":255,"g":150,"b":181},
    {"r":255,"g":255,"b":255},
    {"r":174,"g":16,"b":176},
    {"r":48,"g":255,"b":110},
    {"r":179,"g":132,"b":255},
    {"r":255,"g":255,"b":255},
    {"r":211,"g":198,"b":111},
    {"r":190,"g":223,"b":232},
    {"r":141,"g":163,"b":181},
    {"r":255,"g":222,"b":100},
    {"r":231,"g":178,"b":28},
    {"r":155,"g":214,"b":240},
    {"r":233,"g":183,"b":128},
    {"r":51,"g":84,"b":195},
    {"r":205,"g":153,"b":73},
    {"r":233,"g":207,"b":94},
    {"r":255,"g":255,"b":255},
    {"r":191,"g":142,"b":111}
];

pointColors[LAYERS.WALLS] = [
    {"r":0,"g":0,"b":0},
    {"r":52,"g":52,"b":52},
    {"r":88,"g":61,"b":46},
    {"r":61,"g":58,"b":78},
    {"r":73,"g":51,"b":36},
    {"r":52,"g":52,"b":52},
    {"r":91,"g":30,"b":30},
    {"r":27,"g":31,"b":42},
    {"r":31,"g":39,"b":26},
    {"r":41,"g":28,"b":36},
    {"r":74,"g":62,"b":12},
    {"r":46,"g":56,"b":59},
    {"r":75,"g":32,"b":11},
    {"r":67,"g":37,"b":37},
    {"r":15,"g":15,"b":15},
    {"r":52,"g":43,"b":45},
    {"r":88,"g":61,"b":46},
    {"r":27,"g":31,"b":42},
    {"r":31,"g":39,"b":26},
    {"r":41,"g":28,"b":36},
    {"r":15,"g":15,"b":15},
    {"r":0,"g":0,"b":0},
    {"r":113,"g":99,"b":99},
    {"r":38,"g":38,"b":43},
    {"r":53,"g":39,"b":41},
    {"r":11,"g":35,"b":62},
    {"r":21,"g":63,"b":70},
    {"r":88,"g":61,"b":46},
    {"r":81,"g":84,"b":101},
    {"r":88,"g":23,"b":23},
    {"r":28,"g":88,"b":23},
    {"r":78,"g":87,"b":99},
    {"r":86,"g":17,"b":40},
    {"r":49,"g":47,"b":83},
    {"r":69,"g":67,"b":41},
    {"r":51,"g":51,"b":70},
    {"r":87,"g":59,"b":55},
    {"r":69,"g":67,"b":41},
    {"r":49,"g":57,"b":49},
    {"r":78,"g":79,"b":73},
    {"r":85,"g":102,"b":103},
    {"r":52,"g":50,"b":62},
    {"r":71,"g":42,"b":44},
    {"r":73,"g":66,"b":50},
    {"r":52,"g":52,"b":52},
    {"r":60,"g":59,"b":51},
    {"r":48,"g":57,"b":47},
    {"r":71,"g":77,"b":85},
    {"r":52,"g":52,"b":52},
    {"r":52,"g":52,"b":52},
    {"r":52,"g":52,"b":52},
    {"r":52,"g":52,"b":52},
    {"r":52,"g":52,"b":52},
    {"r":52,"g":52,"b":52},
    {"r":40,"g":56,"b":50},
    {"r":49,"g":48,"b":36},
    {"r":43,"g":33,"b":32},
    {"r":31,"g":40,"b":49},
    {"r":48,"g":35,"b":52},
    {"r":88,"g":61,"b":46},
    {"r":1,"g":52,"b":20},
    {"r":55,"g":39,"b":26},
    {"r":39,"g":33,"b":26},
    {"r":30,"g":80,"b":48},
    {"r":53,"g":80,"b":30},
    {"r":30,"g":80,"b":48},
    {"r":30,"g":80,"b":48},
    {"r":53,"g":80,"b":30},
    {"r":30,"g":80,"b":48},
    {"r":43,"g":42,"b":68},
    {"r":30,"g":70,"b":80},
    {"r":78,"g":105,"b":135},
    {"r":52,"g":84,"b":12},
    {"r":190,"g":204,"b":223},
    {"r":64,"g":62,"b":80},
    {"r":65,"g":65,"b":35},
    {"r":20,"g":46,"b":104},
    {"r":61,"g":13,"b":16},
    {"r":63,"g":39,"b":26},
    {"r":51,"g":47,"b":96},
    {"r":64,"g":62,"b":80},
    {"r":101,"g":51,"b":51},
    {"r":77,"g":64,"b":34},
    {"r":62,"g":38,"b":41},
    {"r":48,"g":78,"b":93},
    {"r":54,"g":63,"b":69},
    {"r":138,"g":73,"b":38},
    {"r":50,"g":15,"b":8},
    {"r":0,"g":0,"b":0},
    {"r":0,"g":0,"b":0},
    {"r":0,"g":0,"b":0},
    {"r":0,"g":0,"b":0},
    {"r":0,"g":0,"b":0},
    {"r":0,"g":0,"b":0},
    {"r":32,"g":40,"b":45},
    {"r":44,"g":41,"b":50},
    {"r":72,"g":50,"b":77},
    {"r":78,"g":50,"b":69},
    {"r":36,"g":45,"b":44},
    {"r":38,"g":49,"b":50},
    {"r":32,"g":40,"b":45},
    {"r":44,"g":41,"b":50},
    {"r":72,"g":50,"b":77},
    {"r":78,"g":50,"b":69},
    {"r":36,"g":45,"b":44},
    {"r":38,"g":49,"b":50},
    {"r":0,"g":0,"b":0},
    {"r":0,"g":0,"b":0},
    {"r":138,"g":73,"b":38},
    {"r":94,"g":25,"b":17},
    {"r":125,"g":36,"b":122},
    {"r":51,"g":35,"b":27},
    {"r":50,"g":15,"b":8},
    {"r":135,"g":58,"b":0},
    {"r":65,"g":52,"b":15},
    {"r":39,"g":42,"b":51},
    {"r":89,"g":26,"b":27},
    {"r":126,"g":123,"b":115},
    {"r":8,"g":50,"b":19},
    {"r":95,"g":21,"b":24},
    {"r":17,"g":31,"b":65},
    {"r":192,"g":173,"b":143},
    {"r":114,"g":114,"b":131},
    {"r":136,"g":119,"b":7},
    {"r":8,"g":72,"b":3},
    {"r":117,"g":132,"b":82},
    {"r":100,"g":102,"b":114},
    {"r":30,"g":118,"b":226},
    {"r":93,"g":6,"b":102},
    {"r":64,"g":40,"b":169},
    {"r":39,"g":34,"b":180},
    {"r":87,"g":94,"b":125},
    {"r":6,"g":6,"b":6},
    {"r":69,"g":72,"b":186},
    {"r":130,"g":62,"b":16},
    {"r":22,"g":123,"b":163},
    {"r":40,"g":86,"b":151},
    {"r":183,"g":75,"b":15},
    {"r":83,"g":80,"b":100},
    {"r":115,"g":65,"b":68},
    {"r":119,"g":108,"b":81},
    {"r":59,"g":67,"b":71},
    {"r":17,"g":172,"b":143},
    {"r":90,"g":112,"b":105},
    {"r":62,"g":28,"b":87},
    {"r":0,"g":0,"b":0},
    {"r":120,"g":59,"b":19},
    {"r":59,"g":59,"b":59},
    {"r":229,"g":218,"b":161},
    {"r":73,"g":59,"b":50},
    {"r":0,"g":0,"b":0},
    {"r":102,"g":75,"b":34},
    {"r":0,"g":0,"b":0},
    {"r":255,"g":145,"b":79},
    {"r":221,"g":79,"b":255},
    {"r":240,"g":240,"b":247},
    {"r":79,"g":255,"b":89},
    {"r":154,"g":83,"b":49},
    {"r":107,"g":49,"b":154},
    {"r":85,"g":89,"b":118},
    {"r":49,"g":154,"b":68},
    {"r":154,"g":49,"b":77},
    {"r":49,"g":49,"b":154},
    {"r":154,"g":148,"b":49},
    {"r":255,"g":79,"b":79},
    {"r":79,"g":102,"b":255},
    {"r":250,"g":255,"b":79},
    {"r":70,"g":68,"b":51},
    {"r":0,"g":0,"b":0},
    {"r":5,"g":5,"b":5},
    {"r":59,"g":39,"b":22},
    {"r":59,"g":39,"b":22},
    {"r":163,"g":96,"b":0},
    {"r":94,"g":163,"b":46},
    {"r":117,"g":32,"b":59},
    {"r":20,"g":11,"b":203},
    {"r":74,"g":69,"b":88},
    {"r":60,"g":30,"b":30},
    {"r":111,"g":117,"b":135},
    {"r":111,"g":117,"b":135},
    {"r":25,"g":23,"b":54},
    {"r":25,"g":23,"b":54},
    {"r":74,"g":71,"b":129},
    {"r":111,"g":117,"b":135},
    {"r":25,"g":23,"b":54},
    {"r":52,"g":52,"b":52},
    {"r":38,"g":9,"b":66},
    {"r":149,"g":80,"b":51},
    {"r":82,"g":63,"b":80},
    {"r":65,"g":61,"b":77},
    {"r":64,"g":65,"b":92},
    {"r":76,"g":53,"b":84},
    {"r":144,"g":67,"b":52},
    {"r":149,"g":48,"b":48},
    {"r":111,"g":32,"b":36},
    {"r":147,"g":48,"b":55},
    {"r":97,"g":67,"b":51},
    {"r":112,"g":80,"b":62},
    {"r":88,"g":61,"b":46},
    {"r":127,"g":94,"b":76},
    {"r":143,"g":50,"b":123},
    {"r":136,"g":120,"b":131},
    {"r":219,"g":92,"b":143},
    {"r":113,"g":64,"b":150},
    {"r":74,"g":67,"b":60},
    {"r":60,"g":78,"b":59},
    {"r":0,"g":54,"b":21},
    {"r":74,"g":97,"b":72},
    {"r":40,"g":37,"b":35},
    {"r":77,"g":63,"b":66},
    {"r":111,"g":6,"b":6},
    {"r":88,"g":67,"b":59},
    {"r":88,"g":87,"b":80},
    {"r":71,"g":71,"b":67},
    {"r":76,"g":52,"b":60},
    {"r":89,"g":48,"b":59},
    {"r":158,"g":100,"b":64},
    {"r":62,"g":45,"b":75},
    {"r":57,"g":14,"b":12},
    {"r":96,"g":72,"b":133},
    {"r":67,"g":55,"b":80},
    {"r":64,"g":37,"b":29},
    {"r":70,"g":51,"b":91},
    {"r":51,"g":18,"b":4},
    {"r":57,"g":55,"b":52},
    {"r":68,"g":68,"b":68},
    {"r":148,"g":138,"b":74},
    {"r":95,"g":137,"b":191},
    {"r":160,"g":2,"b":75},
    {"r":100,"g":55,"b":164},
    {"r":0,"g":117,"b":101}
];

pointColors[LAYERS.LIQUIDS] = {
    "water": {"r":51,"g":133,"b":255},
    "lava": {"r":212,"g":17,"b":17},
    "honey": {"r":255,"g":255,"b":0}
};

pointColors[LAYERS.BACKGROUND] = {
    "space": {"r":51,"g":102,"b":153},
    "sky": {"r":155,"g":209,"b":255},
    "ground": {"r":84,"g":57,"b":42},
    "cavern": {"r":72,"g":64,"b":57},
    "underworld": {"r":51,"g":0,"b":0}
};

export default pointColors;