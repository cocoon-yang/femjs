'use strict';
// 0.2.0 -- Seperating femModel class and element classes from fem.js
//       -- Using require module for loading element class in addGSM method.
//  
// 0.1.3 -- Adding barStress method
// 0.1.2 -- After solve global stiffness equations, calculating global force vector
//
const fs = require('fs');   
var numeric = require("numeric");  
var femmodel = require("femmodel");  

module.exports = function( ) {  
    this._modeldata={};
    this._myModel;
    this._jsonFileSource ;
    this._precision = 2;
    this._globalDOF = 0; 

    this._globalStiffMatrix = [];
    this._oriGlobalStiffnessMatrix;
    this._F = [];
    this._U = [];

    this._elmList = {};


    //
    // Assistant methods 
    //

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

    this.showMatrix = function( theMatrix )   
    { 
        var self = this; 

        var tmp = "";
        var dim = numeric.dim( theMatrix );
        var len = dim.length; 
        if( parseInt(len) == 1 )
        {
            len = dim[0];
            for(var j = 0; j <  parseInt(len) - 1; j++){
                tmp += String((theMatrix[j]).toFixed(self._precision)) + "\t";
            }
            tmp += String((theMatrix[parseInt(len)-1]).toFixed(self._precision))
            console.log( tmp );     
            return;       
        }

        // console.log(dim); 

        for(var i = 0; i < parseInt(dim[0]); i++){
            tmp = ""; 
            len = parseInt(dim[1])
            for(var j = 0; j <  len - 1; j++){
                tmp += String((theMatrix[i][j]).toFixed(self._precision)) + "\t";
            }
            tmp += String((theMatrix[i][len-1]).toFixed(self._precision))
            console.log( tmp );
        }
    }


    // Open FEM model json file
    this.open = function( filePath )   
    { 
        var self = this; 
        var theModel = new femmodel(); 

        theModel.open( filePath );
        self._modeldata = theModel._modeldata;

        self._jsonFileSource = filePath;

        self._myModel = theModel;
    }

    this.saveModel = function(){ 
        var self = this; 
        // Updating source file 
        fs.writeFileSync( self._jsonFileSource, JSON.stringify( self._modeldata, null, " "), {"encoding":'utf8'});    
    } 

    this.showModel = function(){ 
        var self = this; 
        // Updating source file 
        JSON.stringify( self._modeldata, null, " ");  
    } 


    this.refreshNodeDOFID = function( )   
    {
        var self = this; 
        for( var nodeID in self._modeldata["nodes"] )
        {
            self._modeldata["nodes"][nodeID]["dofID"] = -1;
        }        
    }

    this.calcuGlobalDOF = function( )   
    {
        var self = this; 

        self._globalDOF = 0;
        self.refreshNodeDOFID();
        for( var elmID in self._modeldata["elements"] )
        {
            var elm = self._modeldata["elements"][elmID]; 
            var nodesIDList = elm["node"];
            for( var item in nodesIDList ) 
            {
                var nodeID = nodesIDList[item];
                var nodeDOFid = self._modeldata["nodes"][String(parseInt(nodeID))]["dofID"];
                if( parseInt( nodeDOFid ) < 0 ){
                    var dofnum = self._modeldata["nodes"][String(parseInt(nodeID))]["dofnum"]; 
                    self._modeldata["nodes"][String(parseInt(nodeID))]["dofID"] = self._globalDOF;
                    self._globalDOF += parseInt( dofnum );
                }
            }
        }  
        console.log("globalDOF:", self._globalDOF ); 
        // init _globalStiffMatrix
        for( var i = 0; i < parseInt(self._globalDOF); i++)
        {
            var tmp = [];
            for( var j = 0; j < parseInt(self._globalDOF); j++)
            {
                tmp[j] = 0.0;
            }
            self._globalStiffMatrix[i] = tmp;
        }

        // Init force vector and dispmant vector
        for( var i = 0; i < parseInt(self._globalDOF); i++)
        {
            self._F[parseInt(i)] = 0.0;
            self._U[parseInt(i)] = 0.0;
        }                 
    }


    this.calVec2GCoordCos = function( theVector )   
    {
        var self = this; 

        var result = true;
        result = self.checkingObject( theVector )
        if(! Boolean( result ))
        {
            console.error("calVec2GCoordCos: invalid vector");
            return;
        }

        var len = Math.sqrt( theVector[0]*theVector[0] + theVector[1]*theVector[1] + theVector[2]*theVector[2] ); 
        
        var c_alpha = theVector[0] / len; 
        //s_alpha = Math.sqrt( 1 - c_alpha * c_alpha );
        var c_beta = theVector[1] / len; 
        //s_beta = Math.sqrt( 1 - c_beta * c_beta );
        var c_gamma = theVector[2] / len; 

        return [len, c_alpha, c_beta, c_gamma];         
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

    // 
    this.addGSM = function( elemID )   
    {     
        var self = this; 
        var type = self._modeldata["elements"][String(elemID)]["type"];

        var elmStiffMatrix;

        var result = self.checkingObject(self._elmList[type]);  
        if(! Boolean( result ))
        {
            var Element = require( "fem-" + type );
            var myElm = new Element();
            self._elmList[type] = myElm;
            console.log("addGSM(): new element type:", type);
        }
        var myElm = self._elmList[type];
        myElm.setModel( self._myModel );
        elmStiffMatrix = myElm.calcElmStiffMatr(elemID);

        var elmDOFVec = [];
        var nodeDOFVec = []; 
        var elmDOFID = 0;
        var theElm = self._modeldata["elements"][elemID]; 
        var nodes = theElm["node"]; 

        for( var item in nodes )
        {
            var theNode = nodes[item];
            var firstDOFID = self._modeldata["nodes"][ String(theNode) ]["dofID"]; 
            var nodeDOFNum = self._modeldata["nodes"][ String(theNode) ]["dofnum"];        
            // console.log( "firstDOFID ", firstDOFID); 
            for( var i = 0; i < parseInt(nodeDOFNum); i++)
            {
                elmDOFVec[parseInt(elmDOFID)] = parseInt(firstDOFID);
                firstDOFID++;
                elmDOFID++;
            }
        }

        console.log( ); 
        console.log( type, elemID);
        console.log( " elmDOFVec ", elmDOFVec );  
        console.log( " element matrix K:" );   
        //console.log( elmStiffMatrix );     
        self.showMatrix( elmStiffMatrix );         

        var elmDOFNum = elmDOFVec.length; 
        for( var j = 0; j < parseInt(elmDOFNum); j++)
        {
            for( var k = 0; k < parseInt(elmDOFNum); k++)
            {
                var s = elmStiffMatrix[j][k];
                var gsmID_j =  elmDOFVec[j];
                var gsmID_k =  elmDOFVec[k];
                self._globalStiffMatrix[gsmID_j][gsmID_k] += parseFloat(s);
            }
        }
    }

    this.assembly = function( )   
    {
        var self = this; 
        
        self.calcuGlobalDOF();

        for( var elem in self._modeldata["elements"] )
        {
            self.addGSM(elem) ;
        }
        // console.log( "assembly: globalStiffMatrix " );
        // console.log( self._globalStiffMatrix); 
        self._oriGlobalStiffnessMatrix = numeric.clone(self._globalStiffMatrix);
    }

    this.getGlobalDOFID = function( theNodeID, theDOFIDofNode )
    {
        var self = this; 
        if( parseInt(theDOFIDofNode) < 0 )
        {
            return -1;
        }          
        var firstDOFID = self._modeldata["nodes"][ String(theNodeID) ]["dofID"]; 
        var nodeDOFNum = self._modeldata["nodes"][ String(theNodeID) ]["dofnum"]; 
        if( parseInt(theDOFIDofNode) > parseInt(nodeDOFNum) )
        {
            return -1;
        }  
        return parseInt(firstDOFID) + parseInt(theDOFIDofNode) - 1;
    }



    this.forceConstraint = function( theNodeID, theDOFIDofNode, theForce)
    {
        var self = this; 
        var result = true;
        result = self.checkingObject( theNodeID )
        if(! Boolean( result ))
        {
            return;
        }
        result = self.checkingObject( theDOFIDofNode )
        if(! Boolean( result ))
        {
            return;
        }
        result = self.checkingObject( theForce )
        if(! Boolean( result ))
        {
            return;
        }
        var dofID = this.getGlobalDOFID( theNodeID, theDOFIDofNode );
        if( parseInt(dofID) < 0 )
        {
            console.error("forceConstraint: Invalid DOF index");
            return -1;
        }  
        self._F[parseInt(dofID)] = parseFloat(theForce);
    }

    this.show = function()
    {
        var self = this;
        console.log( "show: globalStiffMatrix " );
        // console.log( self._globalStiffMatrix); 
        self.showMatrix( self._globalStiffMatrix );   
        console.log( "displacement vector " );
        //console.log( self._U ); 
        self.showMatrix( self._U ); 
        console.log( "force vector " );
        //console.log( self._F ); 
        self.showMatrix( self._F ); 
    }

    this.displacementConstraint = function( theNodeID, theDOFIDofNode, theDisp )
    {
        var self = this; 
        var result = true;
        result = self.checkingObject( theNodeID )
        if(! Boolean( result ))
        {
            console.log( "displacementConstraint: invalid node ID" );
            return;
        }
        result = self.checkingObject( theDOFIDofNode )
        if(! Boolean( result ))
        {
            console.log( "displacementConstraint: invalid node DOF ID" );
            return;
        }
        result = self.checkingObject( theDisp )
        if(! Boolean( result ))
        {
            console.log( "displacementConstraint: invalid displacement ", theDisp );
            return;
        }
        var dofID = this.getGlobalDOFID( theNodeID, theDOFIDofNode );
        if( parseInt(dofID) < 0 )
        {
            console.error("displacementConstraint: Invalid DOF index");
            return -1;
        }  
        //self._U[parseInt(dofID)] = 1.0;  
        for( var i = 0; i < parseInt(self._globalDOF); i++)
        {
            self._globalStiffMatrix[parseInt(i)][parseInt(dofID)] = 0.0; 
            self._globalStiffMatrix[parseInt(dofID)][parseInt(i)] = 0.0; 
        }
        if( Math.abs(parseFloat(theDisp)) > 0.0001) {
            self._F[parseInt(dofID)] = parseFloat(theDisp); 
            self._globalStiffMatrix[parseInt(dofID)][parseInt(dofID)] = 1.0; 
        }else{
            console.log("ZERO displacement ");
            self._globalStiffMatrix[parseInt(dofID)][parseInt(dofID)] = 900000.0; 
        }
    }    

    this.loadcase = function( loadcaseID )
    {
        var self = this; 
        var result = self.checkingObject( loadcaseID );  
        if(! Boolean( result ))
        {
            console.error("loadcase(): invalid load case id");
            return;
        }

        var theloadcase = self._modeldata["loadcases"][String(loadcaseID)];
        for(var id in theloadcase)
        {
            var theload = theloadcase[id]; 
            var type = theload["type"]; 
            var nodeid = theload["nodeid"]; 
            var localDOFidList = theload["localDOFid"]; 
            var loadvalueList = theload["value"]; 
            if( type == "displacement"){
                for(var dofid in localDOFidList )
                {
                    var localDOFid = localDOFidList[dofid];
                    var value = loadvalueList[dofid]; 
                    //console.log( "displacement dof id = ", localDOFid, " value = ", value);
                    self.displacementConstraint( nodeid, localDOFid, value );
                }
            }
            if( type == "force"){
                for(var dofid in localDOFidList )
                {
                    var localDOFid = localDOFidList[dofid];
                    var value = loadvalueList[dofid];
                    //console.log( "force dof id = ", localDOFid, " value = ", value);
                    self.forceConstraint( nodeid, localDOFid, value );
                }
            }
        }

    }

    this.solve = function()
    {
        var self = this; 
        self.checkGSM(); 
        self._U = numeric.solve( self._globalStiffMatrix, self._F);

        self._F = numeric.dot( self._oriGlobalStiffnessMatrix, self._U);
    }

    this.checkGSM = function()
    {
        var self = this; 
        var ZERO = 0.000001;
        for( var i = 0; i < parseInt(self._globalDOF); i++)
        {
            var allZero = true; 
            var tmpVector = self._globalStiffMatrix[parseInt(i)];
            for( var j = 0; j < parseInt(self._globalDOF); j++)
            {
                if(parseFloat( tmpVector[parseInt(j)]) > parseFloat( ZERO ) )
                {
                    allZero = false;                  
                }
            }
            if(Boolean( allZero ))
            {
                self._globalStiffMatrix[parseInt(i)][parseInt(i)] = 1.0; 
            }
        }
    }
}