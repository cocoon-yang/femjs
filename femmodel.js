'use strict';
var fs = require('fs');   

module.exports = function( ) {  
    this._modeldata={};
    this._jsonFileSource;

    //
    // Methods 
    //
    this.f = function()   
    { 
        console.log("femmodel.foo() ");
    }
    // Open FEM model json file
    this.open = function( filePath )   
    { 
        var self = this; 
        self._jsonFileSource = filePath;
        try{
            var fileData = fs.readFileSync(self._jsonFileSource, "utf8");    
            self._modeldata = JSON.parse(fileData);
        }catch(exp){
            console.log("open model json file failed: ", exp );
        }
    }    

    this.showModel = function(){ 
        var self = this; 
        // Updating source file 
        JSON.stringify( self._modeldata, null, " ");  
    }  
    
    this.save = function(){ 
        var self = this; 
        // Updating source file 
        fs.writeFileSync( self._jsonFileSource, JSON.stringify( self._modeldata, null, " "), {"encoding":'utf8'});    
    } 

    this.show = function(){ 
        var self = this; 
        console.log("femmodel.show() ");
        // Updating source file 
        //JSON.stringify( self._modeldata, null, " ");  
    }  
    

    // adding an item
    this.addItem = function( itemType, itemID, theItem )   
    {
        var self = this; 
        var result = self.checkingObject( self._modeldata);  
        if(! Boolean( result ))
        {
            console.error("addItem(): no FEM model object");
            return;
        }  
        result = self.checkingObject( theItem );  
        if(! Boolean( result ))
        {
            console.error("addItem(): no item object");
            return;
        }  
        self._modeldata[itemType][parseInt(itemID)] = theItem;
    }

    // adding a node
    this.addNode = function( nodeID, theNode )   
    {
        var self = this;  
        self.addItem( "nodes", nodeID, theNode );
    }

    // adding an element
    this.addElement = function( elmID, theElement )   
    {
        var self = this; 
        self.addItem( "elements", elmID, theElement );
    }

    // adding a loadcase
    this.addLoadcase = function( loadcaseID, theLoadcase )   
    {
        var self = this; 
        self.addItem( "loadcases", loadcaseID, theLoadcase );
    }


    this.calcuTwoNodeVector = function( nodeID1, nodeID2 )   
    {
        var self = this;            
        var result = self.checkingObject( nodeID1 );  
        if(! Boolean( result ))
        {
            console.error("calcuTwoNodeDistance(): invalid node id");
            return;
        }
        result = self.checkingObject( nodeID2 );  
        if(! Boolean( result ))
        {
            console.error("calcuTwoNodeDistance(): invalid node id");
            return;
        }

        var n_1 = self._modeldata["nodes"][ String(parseInt(nodeID1)) ];
        var n_2 = self._modeldata["nodes"][ String(parseInt(nodeID2)) ];

        var dx = parseFloat(n_2["coords"]["x"]) - parseFloat(n_1["coords"]["x"]);
        var dy = parseFloat(n_2["coords"]["y"]) - parseFloat(n_1["coords"]["y"]);
        var dz = parseFloat(n_2["coords"]["z"]) - parseFloat(n_1["coords"]["z"]);

        var d = [ dx, dy, dz];
        var len = Math.sqrt( d[0]*d[0] + d[1]*d[1] + d[2]*d[2] ); 
        
        var c_alpha = d[0] / len; 
        //s_alpha = Math.sqrt( 1 - c_alpha * c_alpha );
        var c_beta = d[1] / len; 
        //s_beta = Math.sqrt( 1 - c_beta * c_beta );
        var c_gamma = d[2] / len; 

        return [len, c_alpha, c_beta, c_gamma, dx, dy, dz]; 
    }



    // Checking whether an js object is valid
    this.checkingObject = function( targetObj )
    {
        var result = true; 
        if( typeof targetObj == 'undefined' ) {
            console.log("checkingObject(): undefined Object");
            result = false;
        }
    
        if( typeof targetObj === "" ) {
            console.log("checkingObject(): Object is empty");  
            result = false;
        }
        return result;
    }    
}
