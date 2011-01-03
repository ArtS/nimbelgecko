var data = '';

function tryToGetPiece() {

    var length = data.length,
        i = 0,
        opened = 0,
        modified = false,
        solid_piece;
    
    for (; i < length; i++) {
        if (data[i] == '{') {
            opened++;
            modified = true;
        }
        if (data[i] == '}') {
            opened--;
            modified = true;
        }

        if (modified && opened === 0) {
            solid_piece = data.substr(0, i + 1);

            data = data.substr(i + 1);

            return solid_piece;
        }
    }

    return null;
}

function glueChunksOrKeepCalm(chunk) {

    var res = [],
        solid_piece;

    data += chunk;

    while(true) {
        solid_piece = tryToGetPiece();
        if (solid_piece === null) {
            break;
        }

        res.push(solid_piece);
    }

    if (res.length === 0) {
        return null;
    }

    return res;
}

exports.glueChunksOrKeepCalm = glueChunksOrKeepCalm;
