# femjs

A simple FEM (Finite Element Method) solver in pure JavaScript. 


# install 

```
npm install femjs
```


# Software Structure 
The femjs contains three packages: 
a model, a solver and a library of elements. The model package  maintains the data of FEM model which is stored in a JSON object. numeric is used as the calculator to deal with the linear algebric computations. The algorithms of various elements are packaged into different fem-element modules. femjs would load the modules when it meet new element data. 

 - FEM model 

 - FEM solver  

 - FEM elements

   - bar element
   - spring element 
   - ...


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

model.json is a text file which contains information of the FEM model. The data are stored in JSON formate. The details of an example model.json are shown as following.   
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

The FEM model consists of four nodes and four bar elements: bar 1, bar 2, bar 3 and bar 4. The topology of the structure and element properties are described in “elements" section. The single force loads and displacement constraints can be found in "loadcases" section. 
