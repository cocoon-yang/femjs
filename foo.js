var FEM = require("femjs"); 

const model = new FEM();  
model.open('./model.json');

model.assembly();

model.loadcase( 1 );

model.solve();
model.show();
model.saveModel();

// for( var i = 1; i < 5; i++ )
// {
//     var stress = model.barStress(i); 
//     console.log( "stress = ", stress );
// }

 