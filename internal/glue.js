function tryToGetPiece(buffer) {

    var length = buffer.data.length,
        i = 0,
        opened = 0,
        modified = false,
        solid_piece;
    
    for (; i < length; i++) {
        if (buffer.data[i] == '{') {
            opened++;
            modified = true;
        }
        if (buffer.data[i] == '}') {
            opened--;
            modified = true;
        }

        if (modified && opened === 0) {
            solid_piece = buffer.data.substr(0, i + 1);

            buffer.data = buffer.data.substr(i + 1);

            return solid_piece;
        }
    }

    return null;
}

function glueChunksOrKeepCalm(buffer) {

    var res = [],
        solid_piece;

    buffer.data += buffer.chunk;

    while(true) {
        solid_piece = tryToGetPiece(buffer);
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
