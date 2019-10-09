function BuildingBlueprints() {
    this.data = {
        stadium: {
            colors: [ [200, 100, 0], [250, 150, 50] ],
            blocksByFloor: [
               ['. . . . .',
                '. . . . .',
                '. . 1 . .',
                '. . . . .',
                '. . . . .'],

               ['. . . . .',
                '. 0 1 0 .',
                '. 1 0 1 .',
                '. 0 1 0 .',
                '. . . . .'],
                
               ['. . 1 . .',
                '. 0 0 0 .',
                '1 0 0 0 1',
                '. 0 0 0 .',
                '. . 1 . .'],
                
               ['. 0 0 0 .',
                '0 0 . 0 0',
                '0 . . . 0',
                '0 0 . 0 0',
                '. 0 0 0 .'],
                
               ['. 0 0 0 .',
                '0 . . . 0',
                '0 . . . 0',
                '0 . . . 0',
                '. 0 0 0 .'],
            ]
        },
        
        scienceCenter: {
            colors: [ [200, 100, 0], [250, 150, 50] ],
            blocksByFloor: [
               ['. . . . .',
                '. . . . .',
                '. . 1 . .',
                '. . . . .',
                '. . . . .'],
                
               ['. . . . .',
                '. 0 1 0 .',
                '. 1 0 1 .',
                '. 0 1 0 .',
                '. . . . .'],
                
               ['. . 1 . .',
                '. 0 0 0 .',
                '1 0 0 0 1',
                '. 0 0 0 .',
                '. . 1 . .'],
                
               ['. 0 0 0 .',
                '0 0 . 0 0',
                '0 . . . 0',
                '0 0 . 0 0',
                '. 0 0 0 .'],
                
               ['. 0 0 0 .',
                '0 . . . 0',
                '0 . . . 0',
                '0 . . . 0',
                '. 0 0 0 .'],
            ]
        },
        
    }
};

BuildingBlueprints.prototype.getBlocks = function(type) {
    var blocks = [];
    
    var dataForType = this.data[type];
    if (dataForType) {
        var colors = dataForType.colors;
        var blocksByFloor = dataForType.blocksByFloor;
        
        //
    }

    return blocks;
};
