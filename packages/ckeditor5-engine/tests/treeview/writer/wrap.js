/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* bender-tags: treeview */

'use strict';

import Writer from '/ckeditor5/engine/treeview/writer.js';
import ContainerElement from '/ckeditor5/engine/treeview/containerelement.js';
import AttributeElement from '/ckeditor5/engine/treeview/attributeelement.js';
import Position from '/ckeditor5/engine/treeview/position.js';
import Range from '/ckeditor5/engine/treeview/range.js';
import Text from '/ckeditor5/engine/treeview/text.js';
import utils from '/tests/engine/treeview/writer/_utils/utils.js';
import CKEditorError from '/ckeditor5/utils/ckeditorerror.js';

describe( 'Writer', () => {
	const create = utils.create;
	const test = utils.test;
	let writer;

	beforeEach( () => {
		writer = new Writer();
	} );

	describe( 'wrap', () => {
		it( 'should do nothing on collapsed ranges', () => {
			const description = {
				instanceOf: ContainerElement,
				name: 'p',
				children: [
					{ instanceOf: Text, data: 'foo', rangeStart: 1, rangeEnd: 1 }
				]
			};
			const created = create( writer, description );
			const newRange = writer.wrap( created.range, new AttributeElement( 'b' ), 1 );
			test( writer, newRange, created.node, description );
		} );

		it( 'wraps single text node', () => {
			// <p>[{foobar}]</p>
			// wrap <b>
			// <p>[<b>{foobar}<b>]</p>
			const created = create( writer, {
				instanceOf: ContainerElement,
				name: 'p',
				rangeStart: 0,
				rangeEnd: 1,
				children: [
					{ instanceOf: Text, data: 'foobar' }
				]
			} );

			const b = new AttributeElement( 'b' );
			const newRange = writer.wrap( created.range, b, 1 );

			test( writer, newRange, created.node, {
				instanceOf: ContainerElement,
				name: 'p',
				rangeStart: 0,
				rangeEnd: 1,
				children: [
					{
						instanceOf: AttributeElement,
						name: 'b',
						priority: 1,
						children: [
							{ instanceOf: Text, data: 'foobar' }
						]
					}
				]
			} );
		} );

		it( 'should throw error when range placed in two containers', () => {
			const container1 = new ContainerElement( 'p' );
			const container2 = new ContainerElement( 'p' );
			const range = new Range(
				new Position( container1, 0 ),
				new Position( container2, 1 )
			);
			const b = new AttributeElement( 'b' );

			expect( () => {
				writer.wrap( range, b, 1 );
			} ).to.throw( CKEditorError, 'treeview-writer-invalid-range-container' );
		} );

		it( 'wraps part of a single text node #1', () => {
			// <p>[{foo]bar}</p>
			// wrap with <b>
			// <p>[<b>{foo}</b>]{bar}</p>
			const created = create( writer, {
				instanceOf: ContainerElement,
				name: 'p',
				rangeStart: 0,
				children: [
					{ instanceOf: Text, data: 'foobar', rangeEnd: 3 }
				]
			} );

			const b = new AttributeElement( 'b' );
			const newRange = writer.wrap( created.range, b, 2 );

			test( writer, newRange, created.node, {
				instanceOf: ContainerElement,
				name: 'p',
				rangeStart: 0,
				rangeEnd: 1,
				children: [
					{
						instanceOf: AttributeElement,
						name: 'b',
						priority: 2,
						children: [
							{ instanceOf: Text, data: 'foo' }
						]
					},
					{ instanceOf: Text, data: 'bar' }
				]
			} );
		} );

		it( 'wraps part of a single text node #2', () => {
			// <p>{[foo]bar}</p>
			// wrap with <b>
			// <p>[<b>{foo}</b>]{bar}</p>
			const created = create( writer, {
				instanceOf: ContainerElement,
				name: 'p',
				children: [
					{ instanceOf: Text, data: 'foobar', rangeStart: 0, rangeEnd: 3 }
				]
			} );

			const b = new AttributeElement( 'b' );
			const newRange = writer.wrap( created.range, b, 2 );

			test( writer, newRange, created.node, {
				instanceOf: ContainerElement,
				name: 'p',
				rangeStart: 0,
				rangeEnd: 1,
				children: [
					{
						instanceOf: AttributeElement,
						name: 'b',
						priority: 2,
						children: [
							{ instanceOf: Text, data: 'foo' }
						]
					},
					{ instanceOf: Text, data: 'bar' }
				]
			} );
		} );

		it( 'wraps part of a single text node #3', () => {
			// <p>{foo[bar]}</p>
			// wrap with <b>
			// <p>{foo}[<b>{bar}</b>]</p>
			const created = create( writer, {
				instanceOf: ContainerElement,
				name: 'p',
				children: [
					{ instanceOf: Text, data: 'foobar', rangeStart: 3, rangeEnd: 6 }
				]
			} );

			const b = new AttributeElement( 'b' );
			const newRange = writer.wrap( created.range, b, 2 );

			test( writer, newRange, created.node, {
				instanceOf: ContainerElement,
				name: 'p',
				rangeStart: 1,
				rangeEnd: 2,
				children: [
					{ instanceOf: Text, data: 'foo' },
					{
						instanceOf: AttributeElement,
						name: 'b',
						priority: 2,
						children: [
							{ instanceOf: Text, data: 'bar' }
						]
					}
				]
			} );
		} );

		it( 'should not wrap inside nested containers', () => {
			// <div>[{foobar}<p>{baz}</p>]</div>
			// wrap with <b>
			// <div>[<b>{foobar}</b><p>{baz}</p>]</div>
			const created = create( writer, {
				instanceOf: ContainerElement,
				name: 'div',
				rangeStart: 0,
				rangeEnd: 2,
				children: [
					{ instanceOf: Text, data: 'foobar' },
					{
						instanceOf: ContainerElement,
						name: 'p',
						children: [
							{ instanceOf: Text, data: 'baz' }
						]
					}
				]
			} );

			const newRange = writer.wrap( created.range, new AttributeElement( 'b' ), 1 );
			test( writer, newRange, created.node, {
				instanceOf: ContainerElement,
				name: 'div',
				rangeStart: 0,
				rangeEnd: 2,
				children: [
					{
						instanceOf: AttributeElement,
						name: 'b',
						priority: 1,
						children: [
							{ instanceOf: Text, data: 'foobar' }
						]
					},
					{
						instanceOf: ContainerElement,
						name: 'p',
						children: [
							{ instanceOf: Text, data: 'baz' }
						]
					}
				]
			} );
		} );

		it( 'wraps according to priorities', () => {
			// <p>[<u>{foobar}</u>]</p>
			// wrap with <b> that has higher priority than <u>
			// <p>[<u><b>{foobar}</b></u>]</p>
			const created = create( writer, {
				instanceOf: ContainerElement,
				name: 'p',
				rangeStart: 0,
				rangeEnd: 1,
				children: [
					{
						instanceOf: AttributeElement,
						name: 'u',
						priority: 1,
						children: [
							{ instanceOf: Text, data: 'foobar' }
						]
					}
				]
			} );

			const b = new AttributeElement( 'b' );
			const newRange = writer.wrap( created.range, b, 2 );

			test( writer, newRange, created.node, {
				instanceOf: ContainerElement,
				name: 'p',
				rangeStart: 0,
				rangeEnd: 1,
				children: [
					{
						instanceOf: AttributeElement,
						name: 'u',
						priority: 1,
						children: [
							{
								instanceOf: AttributeElement,
								name: 'b',
								priority: 2,
								children: [
									{ instanceOf: Text, data: 'foobar' }
								]
							}
						]
					}
				]
			} );
		} );

		it( 'merges wrapped nodes #1', () => {
			// <p>[<b>{foo}</b>{bar}<b>{baz}</b>]</p>
			// wrap with <b>
			// <p>[<b>{foobarbaz}</b>]</p>
			const created = create( writer, {
				instanceOf: ContainerElement,
				name: 'p',
				rangeStart: 0,
				rangeEnd: 3,
				children: [
					{
						instanceOf: AttributeElement,
						name: 'b',
						priority: 1,
						children: [
							{ instanceOf: Text, data: 'foo' }
						]
					},
					{ instanceOf: Text, data: 'bar' },
					{
						instanceOf: AttributeElement,
						name: 'b',
						priority: 1,
						children: [
							{ instanceOf: Text, data: 'baz' }
						]
					}
				]
			} );

			const b = new AttributeElement( 'b' );
			const newRange = writer.wrap( created.range, b, 1 );

			test( writer, newRange, created.node, {
				instanceOf: ContainerElement,
				name: 'p',
				rangeStart: 0,
				rangeEnd: 1,
				children: [
					{
						instanceOf: AttributeElement,
						name: 'b',
						priority: 1,
						children: [
							{ instanceOf: Text, data: 'foobarbaz' }
						]
					}
				]
			} );
		} );

		it( 'merges wrapped nodes #2', () => {
			// <p><b>{foo}</b>[{bar]baz}</p>
			// wrap with <b>
			// <p><b>{foo[bar}</b>]{baz}</p>
			const created = create( writer, {
				instanceOf: ContainerElement,
				name: 'p',
				rangeStart: 1,
				children: [
					{
						instanceOf: AttributeElement,
						name: 'b',
						priority: 1,
						children: [
							{ instanceOf: Text, data: 'foo' }
						]
					},
					{ instanceOf: Text, data: 'barbaz', rangeEnd: 3 }
				]
			} );

			const newRange = writer.wrap( created.range, new AttributeElement( 'b' ), 1 );
			test( writer, newRange, created.node, {
				instanceOf: ContainerElement,
				name: 'p',
				rangeEnd: 1,
				children: [
					{
						instanceOf: AttributeElement,
						name: 'b',
						priority: 1,
						children: [
							{ instanceOf: Text, data: 'foobar', rangeStart: 3 }
						]
					},
					{ instanceOf: Text, data: 'baz' }
				]
			} );
		} );

		it( 'merges wrapped nodes #3', () => {
			// <p><b>{foobar}</b>[{baz}]</p>
			// wrap with <b>
			// <p><b>{foobar[baz}</b>]</p>
			const created = create( writer, {
				instanceOf: ContainerElement,
				name: 'p',
				rangeStart: 1,
				rangeEnd: 2,
				children: [
					{
						instanceOf: AttributeElement,
						name: 'b',
						priority: 1,
						children: [
							{ instanceOf: Text, data: 'foobar' }
						]
					},
					{ instanceOf: Text, data: 'baz', rangeEnd: 3 }
				]
			} );

			const newRange = writer.wrap( created.range, new AttributeElement( 'b' ), 1 );
			test( writer, newRange, created.node, {
				instanceOf: ContainerElement,
				name: 'p',
				rangeEnd: 1,
				children: [
					{
						instanceOf: AttributeElement,
						name: 'b',
						priority: 1,
						children: [
							{ instanceOf: Text, data: 'foobarbaz', rangeStart: 6 }
						]
					}
				]
			} );
		} );

		it( 'merges wrapped nodes #4', () => {
			// <p>[{foo}<i>{bar}</i>]{baz}</p>
			// wrap with <b>
			// <p>[<b>{foo}<i>{bar}</i></b>]{baz}</p>
			const created = create( writer, {
				instanceOf: ContainerElement,
				name: 'p',
				rangeStart: 0,
				rangeEnd: 2,
				children: [
					{ instanceOf: Text, data: 'foo' },
					{
						instanceOf: AttributeElement,
						name: 'i',
						priority: 1,
						children: [
							{ instanceOf: Text, data: 'bar' }
						]
					},
					{ instanceOf: Text, data: 'baz' }
				]
			} );

			const newRange = writer.wrap( created.range, new AttributeElement( 'b' ), 1 );
			test( writer, newRange, created.node, {
				instanceOf: ContainerElement,
				name: 'p',
				rangeStart: 0,
				rangeEnd: 1,
				children: [
					{
						instanceOf: AttributeElement,
						name: 'b',
						priority: 1,
						children: [
							{ instanceOf: Text, data: 'foo' },
							{
								instanceOf: AttributeElement,
								name: 'i',
								priority: 1,
								children: [
									{ instanceOf: Text, data: 'bar' }
								]
							}
						]
					},
					{ instanceOf: Text, data: 'baz' }
				]
			} );
		} );

		it( 'merges wrapped nodes #5', () => {
			// <p>[{foo}<i>{bar}</i>{baz}]</p>
			// wrap with <b>, that has higher priority than <i>
			// <p>[<b>{foo}</b><i><b>{bar}</b></i><b>{baz}</b>]</p>
			const created = create( writer, {
				instanceOf: ContainerElement,
				name: 'p',
				rangeStart: 0,
				rangeEnd: 3,
				children: [
					{ instanceOf: Text, data: 'foo' },
					{
						instanceOf: AttributeElement,
						name: 'i',
						priority: 1,
						children: [
							{ instanceOf: Text, data: 'bar' }
						]
					},
					{ instanceOf: Text, data: 'baz' }
				]
			} );

			const newRange = writer.wrap( created.range, new AttributeElement( 'b' ), 2 );
			test( writer, newRange, created.node, {
				instanceOf: ContainerElement,
				name: 'p',
				rangeStart: 0,
				rangeEnd: 3,
				children: [
					{
						instanceOf: AttributeElement,
						name: 'b',
						priority: 2,
						children: [
							{ instanceOf: Text, data: 'foo' }
						]
					},
					{
						instanceOf: AttributeElement,
						name: 'i',
						priority: 1,
						children: [
							{
								instanceOf: AttributeElement,
								name: 'b',
								priority: 2,
								children: [
									{ instanceOf: Text, data: 'bar' }
								]
							}
						]
					},
					{
						instanceOf: AttributeElement,
						name: 'b',
						priority: 2,
						children: [
							{ instanceOf: Text, data: 'baz' }
						]
					}
				]
			} );
		} );
	} );
} );
