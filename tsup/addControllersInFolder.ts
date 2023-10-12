import { readdirSync } from 'fs';
import { resolve } from 'path/posix';


export function addControllersInFolder(path: string, entry: string[]) {
	readdirSync(resolve(path), {
		withFileTypes: true
	})
	.filter(dirent => dirent.isDirectory())
	.forEach(dirent => {
		entry.push(`${path}/${dirent.name}/${dirent.name}.ts`);
	});
}
