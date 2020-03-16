# femjs
A simple fem solver in pure JavaScript.

# install 

```
npm install femjs
```


# Example

## js file
```
var FEM = require("femjs"); 

const model = new FEM();  
model.open('./model.json');

model.assembly();

model.loadcase( 1 );

model.solve();
model.show();
model.saveModel();
```

## FEM model file

model.json contains the fem model of a simple truss structure.  The model consists of four nodes and four elements, bar 1, bar 2, bar 3 and bar 4. The topology of the structure and element properties are described in “elements" section. The single force loads and displacement constraints can be found in "loadcases". 
```
{
 "materials": {
  "Fe": {
   "E": 295000,
   "po": 0.3
  },
  "spring": {
   "k": 100
  }
 },
 "nodes": {
  "1": {
   "coords": {
    "x": 0,
    "y": 0,
    "z": 0
   },
   "dofnum": 3,
   "dofID": 0,
   "dof": {
    "u": 0,
    "v": 0,
    "w": 0
   }
  },
  "2": {
   "coords": {
    "x": 400,
    "y": 0,
    "z": 0
   },
   "dofnum": 3,
   "dofID": 3,
   "dof": {
    "u": 0,
    "v": 0,
    "w": 0
   }
  },
  "3": {
   "coords": {
    "x": 400,
    "y": 300,
    "z": 0
   },
   "dofnum": 3,
   "dofID": 6,
   "dof": {
    "u": 0,
    "v": 0,
    "w": 0
   }
  },
  "4": {
   "coords": {
    "x": 0,
    "y": 300,
    "z": 0
   },
   "dofnum": 3,
   "dofID": 9,
   "dof": {
    "u": 0,
    "v": 0,
    "w": 0
   }
  }
 },
 "elements": {
  "1": {
   "type": "bar",
   "node": [
    1,
    2
   ],
   "material": "Fe",
   "area": 100
  },
  "2": {
   "type": "bar",
   "node": [
    2,
    3
   ],
   "material": "Fe",
   "area": 100
  },
  "3": {
   "type": "bar",
   "node": [
    1,
    3
   ],
   "material": "Fe",
   "area": 100
  },
  "4": {
   "type": "bar",
   "node": [
    3,
    4
   ],
   "material": "Fe",
   "area": 100
  }
 },
 "loadcases": {
  "1": {
   "1": {
    "type": "force",
    "nodeid": 3,
    "localDOFid": [
     2
    ],
    "value": [
     -25000
    ]
   },
   "2": {
    "type": "force",
    "nodeid": 2,
    "localDOFid": [
     1
    ],
    "value": [
     20000
    ]
   },
   "3": {
    "type": "displacement",
    "nodeid": 1,
    "localDOFid": [
     1,
     2,
     3
    ],
    "value": [
     0,
     0,
     0
    ]
   },
   "4": {
    "type": "displacement",
    "nodeid": 2,
    "localDOFid": [
     2,
     3
    ],
    "value": [
     0,
     0
    ]
   },
   "5": {
    "type": "displacement",
    "nodeid": 3,
    "localDOFid": [
     3
    ],
    "value": [
     0
    ]
   },
   "6": {
    "type": "displacement",
    "nodeid": 4,
    "localDOFid": [
     1,
     2,
     3
    ],
    "value": [
     0,
     0,
     0
    ]
   }
  }
 }
}
```
